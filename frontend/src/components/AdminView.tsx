import { useState, useEffect } from 'react';
import './AdminView.css';

interface QueryResult {
  columns: string[];
  data: any[];
  row_count: number;
}

interface TableInfo {
  tables: string[];
}

interface TableSchema {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
}

interface ImageInfo {
  filename: string;
  size: number;
  url: string;
}

interface AdminViewProps {
  username: string;
  userId: number;
  onLogout: () => void;
}

function AdminView({ username, userId, onLogout }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'query' | 'tables' | 'images'>('query');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM user');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSchema, setTableSchema] = useState<TableSchema[]>([]);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    loadTables();
    loadImages();
  }, []);

  const loadTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tables`);
      const data: TableInfo = await response.json();
      setTables(data.tables);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  };

  const loadImages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/images`);
      const data = await response.json();
      setImages(data.images);
    } catch (err) {
      console.error('Failed to load images:', err);
    }
  };

  const downloadAllImages = async () => {
    for (const image of images) {
      try {
        // Create a temporary anchor element and trigger download
        const a = document.createElement('a');
        a.href = `${API_BASE_URL}${image.url}`;
        a.download = image.filename;
        a.target = '_blank'; // Fallback if download doesn't work
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to download ${image.filename}:`, err);
      }
    }
  };

  const downloadResultsAsCSV = () => {
    if (!queryResult) return;

    // Create CSV content
    const headers = queryResult.columns.join(',');
    const rows = queryResult.data.map(row =>
      queryResult.columns.map(col => {
        const value = row[col];
        // Handle null/undefined values and escape quotes
        if (value === null || value === undefined) return 'NULL';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const executeQuery = async (queryToExecute?: string) => {
    const query = queryToExecute || sqlQuery;

    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    setIsLoading(true);
    setError('');
    setQueryResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Query execution failed');
      }

      setQueryResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableSchema = async (tableName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/table-schema/${tableName}`);
      const data = await response.json();
      setTableSchema(data.schema);
      setSelectedTable(tableName);

      // Also run a query to show table data
      const tableQuery = `SELECT * FROM ${tableName}`;
      setSqlQuery(tableQuery);
      setActiveTab('query');
      setTimeout(() => executeQuery(tableQuery), 100);
    } catch (err) {
      console.error('Failed to load table schema:', err);
    }
  };

  const quickQueries = [
    { label: 'All Users', query: 'SELECT * FROM user' },
    { label: 'All Images', query: 'SELECT * FROM image_match' },
    { label: 'All Analysis Data', query: 'SELECT ua.object_id, ua.user_id, u.name as user_name, up.total_profit, ua.image_name, ua.object_id_in_image, ua.area_px2, ua.top_left_x, ua.top_left_y, ua.bottom_right_x, ua.bottom_right_y, ua.center, ua.width_px, ua.length_px, ua.volume_px3, ua.solidity, ua.strict_solidity, ua.lw_ratio, ua.area_in2, ua.weight_oz, ua.grade, ua.price_usd FROM user_analysis ua LEFT JOIN user u ON ua.user_id = u.id LEFT JOIN user_profit up ON ua.user_id = up.user_id ORDER BY up.timestamp DESC' },
    { label: 'User Profit', query: 'SELECT up.id, u.name as user_name, up.user_id, up.scenario, up.total_profit, up.total_revenue, up.total_penalty, up.marketable_proportion, up.not_marketable_proportion, up.total_classifications, up.total_marketable_classifications, up.total_not_marketable_classifications, up.total_marketable_revenue, up.total_not_marketable_revenue, up.timestamp FROM user_profit up LEFT JOIN user u ON up.user_id = u.id ORDER BY up.timestamp DESC' },
    { label: 'User Count', query: 'SELECT COUNT(*) as user_count FROM user' },
    { label: 'Images per User', query: 'SELECT u.name, COUNT(im.image_id) as image_count FROM user u LEFT JOIN image_match im ON u.id = im.user_id GROUP BY u.id, u.name' },
    { label: 'Analysis Summary', query: 'SELECT image_name, COUNT(*) as object_count, AVG(area_px2) as avg_area FROM user_analysis GROUP BY image_name' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-info">
          <span className="admin-badge">ADMIN</span>
          <span className="user-info">Logged in as: {username} (ID: {userId})</span>
          <button className="admin-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'query' ? 'active' : ''}`}
          onClick={() => setActiveTab('query')}
        >
          SQL Query
        </button>
        <button
          className={`tab-button ${activeTab === 'tables' ? 'active' : ''}`}
          onClick={() => setActiveTab('tables')}
        >
          Database Tables
        </button>
        <button
          className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Output Images ({images.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'query' && (
          <div className="query-panel">
            <div className="quick-queries">
              <h3>Quick Queries</h3>
              <div className="query-buttons">
                {quickQueries.map((q, idx) => (
                  <button
                    key={idx}
                    className="quick-query-btn"
                    onClick={() => {
                      setSqlQuery(q.query);
                      executeQuery(q.query);
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="query-input-section">
              <label htmlFor="sql-query">SQL Query (SELECT only)</label>
              <textarea
                id="sql-query"
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    executeQuery();
                  }
                }}
                placeholder="Enter your SQL query here... (Ctrl+Enter to execute)"
                rows={5}
              />
              <button
                className="execute-btn"
                onClick={() => executeQuery()}
                disabled={isLoading}
              >
                {isLoading ? 'Executing...' : 'Execute Query'}
              </button>
            </div>

            {error && (
              <div className="error-box">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {queryResult && (
              <div className="results-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Results ({queryResult.row_count} rows)</h3>
                  <button className="refresh-btn" onClick={downloadResultsAsCSV}>
                    Download Results (CSV)
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {queryResult.columns.map((col, colIdx) => (
                            <td key={colIdx}>{row[col] !== null ? String(row[col]) : 'NULL'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="tables-panel">
            <h3>Database Tables</h3>
            <div className="tables-grid">
              {tables.map((table) => (
                <div
                  key={table}
                  className={`table-card ${selectedTable === table ? 'selected' : ''}`}
                  onClick={() => loadTableSchema(table)}
                >
                  <div className="table-icon">📊</div>
                  <div className="table-name">{table}</div>
                  <button className="view-btn">View Data</button>
                </div>
              ))}
            </div>

            {selectedTable && tableSchema.length > 0 && (
              <div className="schema-section">
                <h3>Schema: {selectedTable}</h3>
                <table className="schema-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Constraints</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableSchema.map((col, idx) => (
                      <tr key={idx}>
                        <td>
                          {col.name}
                          {col.pk && <span className="pk-badge">PK</span>}
                        </td>
                        <td>{col.type}</td>
                        <td>{col.notnull ? 'NOT NULL' : 'NULLABLE'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="images-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Output Images</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="refresh-btn" onClick={loadImages}>
                  Refresh Images
                </button>
                <button
                  className="refresh-btn"
                  onClick={downloadAllImages}
                  disabled={images.length === 0}
                >
                  Download All Images
                </button>
              </div>
            </div>

            <div className="images-grid">
              {images.map((image) => (
                <div
                  key={image.filename}
                  className="image-card"
                  onClick={() => setSelectedImage(image.filename)}
                >
                  <img
                    src={`${API_BASE_URL}${image.url}`}
                    alt={image.filename}
                    loading="lazy"
                  />
                  <div className="image-info">
                    <div className="image-name">{image.filename}</div>
                    <div className="image-size">
                      {(image.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {images.length === 0 && (
              <div className="empty-state">
                <p>No images found in output directory</p>
              </div>
            )}

            {selectedImage && (
              <div className="image-modal" onClick={() => setSelectedImage(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="close-btn" onClick={() => setSelectedImage(null)}>
                    ✕
                  </button>
                  <img
                    src={`${API_BASE_URL}/output/file/${selectedImage}`}
                    alt={selectedImage}
                  />
                  <div className="modal-filename">{selectedImage}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminView;
