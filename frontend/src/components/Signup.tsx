import { useState, FormEvent } from 'react';
import { getOrCreateName } from '../services/UserService';
import './Signup.css';

interface SignupProps {
  onSignupComplete: (userId: number, username: string) => void;
}

function Signup({ onSignupComplete }: SignupProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingUser, setExistingUser] = useState<{id: number, name: string} | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsLoading(true);
    setError('');
    setExistingUser(null);

    try {
      const response = await getOrCreateName(username.trim());

      // Store user data in localStorage
      const userData = {
        id: response.id,
        name: response.name
      };
      localStorage.setItem('user', JSON.stringify(userData));

      if (response.is_new_name === 1) {
        // New user - auto-continue
        onSignupComplete(response.id, response.name);
      } else {
        // Existing user - show continue button
        setExistingUser({ id: response.id, name: response.name });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (existingUser) {
      onSignupComplete(existingUser.id, existingUser.name);
    }
  };

  return (
    <div className="signup-container">
      <div className="grain-background"></div>

      <div className="signup-card">
        <div className="wheat-icon">🌾</div>

        <h1 className="signup-title">Welcome to the Harvest</h1>
        <p className="signup-subtitle">Enter your name to begin</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="input-group">
            <label htmlFor="username" className="input-label">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="username-input"
              disabled={isLoading || existingUser !== null}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {existingUser && (
            <div className="welcome-back-message">
              <span className="welcome-icon">👋</span>
              <p>Welcome back, <strong>{existingUser.name}</strong>!</p>
              <p className="welcome-subtext">We found your account in our fields</p>
            </div>
          )}

          {!existingUser && (
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="button-icon">🚜</span>
                  Continue to Farm
                </>
              )}
            </button>
          )}

          {existingUser && (
            <button
              type="button"
              onClick={handleContinue}
              className="continue-button"
            >
              <span className="button-icon">✓</span>
              Continue
            </button>
          )}
        </form>

        <div className="farm-footer">
          <span className="footer-icon">🌻</span>
          <span className="footer-text">Grain & Farm Image Processor</span>
          <span className="footer-icon">🌻</span>
        </div>
      </div>
    </div>
  );
}

export default Signup;
