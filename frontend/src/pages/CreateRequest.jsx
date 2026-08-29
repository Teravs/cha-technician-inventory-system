import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [availableItems, setAvailableItems] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [requestItems, setRequestItems] = useState([
    { itemId: '', quantity: 1, maxStock: 0, unitSymbol: '' }
  ]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch active items with current stock info
  useEffect(() => {
    axios.get('/api/items')
      .then((res) => {
        // Only allow items that are active and have stock > 0
        const activeStockedItems = res.data.filter((item) => item.isActive && item.stock > 0);
        setAvailableItems(activeStockedItems);
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.message || 'Failed to load inventory items.');
      })
      .finally(() => setLoadingItems(false));
  }, []);

  const handleItemChange = (index, selectedItemId) => {
    const selected = availableItems.find((i) => i.id === parseInt(selectedItemId, 10));
    const updated = [...requestItems];
    
    if (selected) {
      updated[index] = {
        itemId: selected.id,
        quantity: 1,
        maxStock: selected.stock,
        unitSymbol: selected.unit?.symbol || 'PCS'
      };
    } else {
      updated[index] = { itemId: '', quantity: 1, maxStock: 0, unitSymbol: '' };
    }
    setRequestItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const updated = [...requestItems];
    const parsedQty = Math.max(1, parseInt(qty, 10) || 1);
    updated[index].quantity = parsedQty;
    setRequestItems(updated);
  };

  const handleAddItemRow = () => {
    setRequestItems([...requestItems, { itemId: '', quantity: 1, maxStock: 0, unitSymbol: '' }]);
  };

  const handleRemoveItemRow = (index) => {
    if (requestItems.length === 1) return;
    const updated = requestItems.filter((_, i) => i !== index);
    setRequestItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!purpose.trim()) {
      setErrorMessage('Please provide the operational purpose for this request.');
      return;
    }

    const itemIds = requestItems.map((i) => i.itemId);
    if (itemIds.some((id) => !id)) {
      setErrorMessage('Please select a valid item for each row.');
      return;
    }

    // Check duplicates
    const uniqueIds = new Set(itemIds);
    if (uniqueIds.size !== itemIds.length) {
      setErrorMessage('Duplicate items detected. Please consolidate quantities into a single row.');
      return;
    }

    // Check stock boundaries
    for (const row of requestItems) {
      if (row.quantity > row.maxStock) {
        setErrorMessage(`Requested quantity exceeds available stock for one or more items.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await axios.post('/api/requests', {
        purpose: purpose.trim(),
        items: requestItems.map((i) => ({
          itemId: i.itemId,
          quantity: i.quantity
        }))
      });
      navigate('/requests');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to submit request.');
      setSubmitting(false);
    }
  };

  if (loadingItems) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0" style={{ maxWidth: '850px' }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <Link to="/requests" className="btn btn-light border btn-sm">
          <i className="bi bi-arrow-left me-1"></i> Back to Requests
        </Link>
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Create Material Request</h2>
          <small className="text-secondary">Submit a multi-item warehouse inventory request</small>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card border-slate-200 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="mb-4">
              <label htmlFor="purpose" className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>
                Operational Purpose / Work Order Details <span className="text-danger">*</span>
              </label>
              <textarea
                id="purpose"
                className="form-control"
                rows="3"
                placeholder="e.g., Scheduled maintenance for HVAC unit at Main Branch Office"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-semibold text-dark" style={{ fontSize: '14px' }}>Requested Items</span>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={handleAddItemRow}
                disabled={requestItems.length >= availableItems.length}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Item
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '55%' }}>Item Name & Specification</th>
                    <th style={{ width: '25%' }}>Quantity</th>
                    <th style={{ width: '15%' }} className="text-center">Available</th>
                    <th style={{ width: '5%' }} className="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {requestItems.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={row.itemId}
                          onChange={(e) => handleItemChange(index, e.target.value)}
                          required
                        >
                          <option value="">-- Select Warehouse Item --</option>
                          {availableItems.map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                              disabled={requestItems.some((r, i) => i !== index && r.itemId === item.id)}
                            >
                              {item.name} ({item.brand} - {item.size})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            min="1"
                            max={row.maxStock || 1}
                            className={`form-control ${row.quantity > row.maxStock && row.itemId ? 'is-invalid' : ''}`}
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            disabled={!row.itemId}
                            required
                          />
                          <span className="input-group-text">{row.unitSymbol || '-'}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="fw-semibold text-secondary">
                          {row.itemId ? `${row.maxStock} ${row.unitSymbol}` : '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm border-0"
                          onClick={() => handleRemoveItemRow(index)}
                          disabled={requestItems.length === 1}
                          title="Remove item"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer bg-light px-4 py-3 d-flex justify-content-end gap-2 border-top">
            <Link to="/requests" className="btn btn-light border">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}