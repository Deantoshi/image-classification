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

  const API_BASE_URL = 'http://localhost:8000';

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

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
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
        body: JSON.stringify({ query: sqlQuery }),
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
      setSqlQuery(`SELECT * FROM ${tableName}`);
      setActiveTab('query');
      setTimeout(() => executeQuery(), 100);
    } catch (err) {
      console.error('Failed to load table schema:', err);
    }
  };

  const quickQueries = [
    { label: 'All Users', query: 'SELECT * FROM user' },
    { label: 'All Images', query: 'SELECT * FROM image_match' },
    { label: 'All Analysis Data', query: 'SELECT * FROM user_analysis' },
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
                      setTimeout(() => executeQuery(), 100);
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
                placeholder="Enter your SQL query here..."
                rows={5}
              />
              <button
                className="execute-btn"
                onClick={executeQuery}
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
                <h3>Results ({queryResult.row_count} rows)</h3>
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
            <h3>Output Images</h3>
            <button className="refresh-btn" onClick={loadImages}>
              Refresh Images
            </button>

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
