import businessName from './assets/shapesmith-studio-gradient-trans-bg.png';
// import instagramIcon from './assets/instagram-icon.svg';
// import mailIcon from './assets/mail-icon.svg';


import instagramIcon from './assets/Instagram_logo.png';
import mailIcon from './assets/computer-email-icon.png';

import './App.css';
import ContactForm from './components/contact-form';
import { useState } from 'react';

  // const StaticMenu = () => {
  //   const homeSection = useScrollSection('home');
  //   const aboutSection = useScrollSection('about');
  
  //   return (
  //     <ul>
  //       <li onClick={homeSection.onClick} selected={homeSection.selected}>
  //         Home
  //       </li>
  //       <li onClick={aboutSection.onClick} selected={aboutSection.selected}>
  //         About
  //       </li>
  //     </ul>
  //   );
  // };
  
  // const App = () => (
  //   <ScrollingProvider>
  //     <StaticMenu />
  //     <Section id="home">MY HOME</Section>
  //     <Section id="about">ABOUT ME</Section>
  //   </ScrollingProvider>
  // );


function App() {

  const [showContactModal, setShowContactModal] = useState(false);

  return (
      <div className="App">

          {/* Landing Page Hero */}
          <div id="hero" className="flex flex-col space-y-10 h-screen justify-center items-center bg-violet-900">


              <div>
                <h1 className="text-3xl font-bold font-poppins text-gray-100">Shop Coming Soon!</h1>
              </div>

              <div className="flex flex-col items-center">
                <img src={businessName} className="w-5/6" alt="shapesmith studio" />
                <h1 className="text-lg font-poppins text-gray-100">Laser cut art and installations</h1>
              </div>

              
              <div className="bg-[#FFE632] opacity-75 w-1/2 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
                
                <h1 className="text-xl font-bold font-poppins text-gray-800 pb-4">Connect With Us</h1>

                <div className="flex flex-row justify-center items-center space-x-14">

                  <div className="flex flex-col justify-center items-center">
                    <a
                      href="https://www.instagram.com/shapesmith.studio/"
                    >
                      <img src={instagramIcon} className="h-12" alt="instagram-button" />
                    </a>
                    <p className="font-medium font-poppins text-gray-800">Latest works</p>
                  </div>

                  <div className="flex flex-col justify-center items-center">
                    <button
                      onClick={() => setShowContactModal(true)}
                    >
                      <img src={mailIcon} className="h-12" alt="email-button" />
                    </button>
                    <p className="font-medium font-poppins text-gray-800">Inquiries</p>
                  </div>
                </div>

              </div>



              {showContactModal ? (
                <>
                <div className="fixed inset-0 z-10 overflow-y-auto">
                  <div
                      className="fixed inset-0 w-full h-full bg-black opacity-40"
                      onClick={() => setShowContactModal(false)}
                  ></div>
                  <div className="flex items-center min-h-screen">
                      <div className="relative w-full max-w-lg mx-auto bg-trans rounded-md shadow-lg">
                        
                        <ContactForm 
                          onSubmit={(e) => {
                            e.preventDefault();
                            setShowContactModal(false);
                          }}
                          onCancel={() => setShowContactModal(false)}
                        />
                          
                      </div>
                  </div>
                </div>

              </>
              ) : null}
                     
          </div>
        
      </div>
  );
}

export default App;
