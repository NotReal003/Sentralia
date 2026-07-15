import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSpinner } from "react-icons/fa";
import { IoLogIn } from "react-icons/io5";
import { ImExit } from "react-icons/im";
import { MdNavigateNext } from "react-icons/md";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import apiClient, { API, APIURL, getAuthHeaders } from '../utils/api';
import { FcSettings } from "react-icons/fc";
import toast, { Toaster } from "react-hot-toast";

export default function Navbar({ isAuthenticated }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [errorIssue, setErrorIssue] = useState('');
  const [LogoutModal, setLogoutModal] = useState(false);
  const [logout, setLogout] = useState(false);
  const navigate = useNavigate();
  const domainName = window.location.hostname;

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      try {
        const res = await fetch(`${API}/users/@me`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });

        if (res.status === 403) {
          document.cookie = `token=; Max-Age=0; path=/; domain=${domainName}; secure`;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          console.log('Cookie cleared');
          setLoading(false);
          setShowAlert(true);
          setErrorIssue('You have been logged out due to inactivity.');
        }

        if (!res.ok) {
          const errorData = await res.json();
          setLoading(false);
          setShowAlert(true);
          setErrorIssue(errorData.message || 'A: Connection error between the server and the client :/')
          return;
        }

        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.staff === true) {
          toast('Welcome Staff Member');
        } else {
          toast("Welcome");
        }
      } catch (error) {
        console.error(error);
        toast.error('Something went wrong :/');
        setShowAlert(true);
        setErrorIssue('B: Connection error between the server and the client :/');
      }

      setLoading(false);
    };

    if (isAuthenticated) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, API]);

  const handleLogout = async () => {
    try {
      setLogout(true);
      const res = await apiClient.get(`${APIURL}/auth/signout`);
      if (res.status !== 200) {
        setShowAlert(true);
        setErrorIssue('We are unable to logout you.');
        setLogout(false);
        setLogoutModal(false);
      }

       document.cookie = `token=; Max-Age=0; path=/; domain=${domainName}; secure`;
       localStorage.removeItem("token");
       localStorage.removeItem("user");
      window.location.href = '/';
    } catch (error) {
      setShowAlert(true);
      setLogout(false);
      setLogoutModal(false);
      setErrorIssue(error.response?.data?.message || 'We are unable to logout you.')
      console.error(error);
    }
  };

  return (
    <>
      <Toaster />
      {showAlert && (
        <div role="alert" className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info h-6 w-6 shrink-0">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>
            We are unable to verify you: <strong>{errorIssue}</strong>
          </span>
          <div>
            <button className="btn no-animation btn-sm bg-yellow-500 text-white font-medium rounded-lg shadow-sm hover:bg-yellow-600 transition-all" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      )}

      <nav className="z-20 mb-5">
        <div className="container"></div>

        <div className="drawer drawer-end">
          <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content flex flex-col">
            <div className="w-full navbar bg-base-300">
              <Link to="/" className="font-bold text-lg flex-1 px-2 mx-2">
                NotReal003
              </Link>
              <div className="dropdown dropdown-bottom dropdown-end">
                <div tabIndex={0} role="button" className="btn m-1 btn-sm">
                  Display
                  <svg
                    width="12px"
                    height="12px"
                    className="inline-block h-2 w-2 fill-current opacity-60"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 2048 2048">
                    <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
                  </svg>
                </div>
                <ul tabIndex={0} className="dropdown-content bg-base-300 rounded-box z-[1] w-52 p-2 shadow-2xl">
                  <li>
                    <input
                      type="radio"
                      name="theme-dropdown"
                      className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
                      aria-label="Not Available"
                      value="default" />
                  </li>
                </ul>
              </div>

              <div className="dropdown dropdown-bottom dropdown-end">
                <div tabIndex={0} role="button" className="btn m-1 btn-sm flex items-center justify-center"><MdNavigateNext />Requests</div>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                  <li><Link to="https://notreal003.pages.dev">Home <LiaExternalLinkAltSolid /></Link></li>
                  <li><Link to="/support">Support</Link></li>
                  <li><Link to="/apply">Application</Link></li>
                  <li><Link to="/report">Report Activity</Link></li>
                </ul>
              </div>

              {loading ? (
                <div className="flex items-center mr-4">
                  <FaSpinner className="animate-spin h-4 w-4" />
                </div>
              ) : (
                <div className="dropdown dropdown-bottom dropdown-end mr-4 ml-2">
                  <button tabIndex={0} className="flex items-center justify-center">
                    {user && user.avatarHash ? (
                      <img
                        src={`${user.avatarHash}`}
                        className="size-6 object-cover rounded-full border-blue-500"
                        alt="user"
                      />
                    ) : (
                      <FaUserCircle className="size-6" />
                    )}
                  </button>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                    {isAuthenticated ? (
                      <>
                        <li>
                          <span onClick={() => navigate('/profile')} className="flex items-center gap-x-3">
                            <FcSettings /> Profile
                          </span>
                        </li>
                        <li>
                          <span onClick={() => setLogoutModal(true)} className="flex items-center gap-x-3 hover:text-red-500 cursor-pointer">
                            <ImExit className="size-3" /> <span>Sign out</span>
                          </span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link to={`${APIURL}/auth/signin`} className="flex items-center gap-x-2 hover:text-blue-500">
                            <IoLogIn className="size-4" /> <span>Sign in with Discord</span>
                          </Link>
                        </li>
                        <li>
                          <Link to={`${APIURL}/auth/google`} className="flex items-center gap-x-2 hover:text-blue-500">
                            <IoLogIn className="size-4" /> <span>Sign in with Google</span>
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {LogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-bage-100 z-50">
          <div className="bg-base-100 rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4">Confirm Logout</h2>
            <p className="text-white font-semibold">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={handleLogout} disabled={logout} className="btn no-animation bg-red-600 text-white font-medium rounded-lg shadow-sm flex items-center hover:bg-red-700 transition-all">Logout {logout ? <FaSpinner className="animate-spin inline-block align-middle" /> : <ImExit />}</button>
              <button onClick={() => setLogoutModal(false)} className="btn no-animation bg-blue-600 text-white font-medium rounded-lg shadow-sm flex items-center hover:bg-blue-700 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
