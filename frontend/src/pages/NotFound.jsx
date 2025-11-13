import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <section>
      <h1>Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/dashboard">Return to dashboard</Link>
    </section>
  );
};

export default NotFound;

