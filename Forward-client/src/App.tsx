import './App.css'
import Dashboard from './pages/Dashboard';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  let Page;
  switch (window.location.pathname) {
    case "/":
      Page = <h1>Home</h1>
      break;
    case "/dashboard":
      Page = <Dashboard className='mx-100 mt-18'/>
      break;
    default:
      Page = <h1>404: Page not found</h1>
      break
  }
  return <>
  <Header/>
  {Page}
  <Footer/>
  </>
}

export default App
