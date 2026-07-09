import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { seedAll } from './data/seedAll';

function App() {
  useEffect(() => {
    seedAll();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
