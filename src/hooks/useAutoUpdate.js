import { useEffect } from 'react';
import { ref, onValue } from 'firebase/database';

import { database } from '../utils/firebase';

const useAutoUpdate = (currentLocalVersion) => {
  useEffect(() => {
    // Listens to the 'kioskSettings/currentVersion' node in Firebase RTDB
    const versionRef = ref(database, 'kioskSettings/currentVersion');
    
    const unsubscribe = onValue(versionRef, (snapshot) => {
      const liveVersion = snapshot.val();
      
      // If Firebase version doesn't match the hardcoded local version, force reload
      if (liveVersion && liveVersion !== currentLocalVersion) {
        console.log(`Update detected! Local: ${currentLocalVersion}, Live: ${liveVersion}`);
        
        // Wait 2 seconds to ensure any active network requests finish, then reload
        setTimeout(() => {
          window.location.reload(true);
        }, 2000);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentLocalVersion]);
};

export default useAutoUpdate;