import './LoadingSpinner.css';

export default function LoadingSpinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <p className="spinner__text">Finding the perfect watch...</p>
    </div>
  );
}
