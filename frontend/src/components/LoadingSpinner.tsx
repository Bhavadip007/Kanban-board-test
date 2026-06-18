interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner = ({ label }: LoadingSpinnerProps) => (
  <div className="loading-spinner">
    <div className="spinner" />
    {label && <p>{label}</p>}
  </div>
);
