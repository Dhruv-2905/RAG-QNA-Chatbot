import { Route, Routes, useSearchParams } from "react-router-dom";
import BuyerBot from "./pages/BuyerBot";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { setDataId } from "./redux/chatbot";
import NotAuthenticated from "./common/NotAuthenticated";

function App() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    try{
      const appType = searchParams.get("appType");
      if (appType === "portal") {
        dispatch(setDataId("supplier"));
        setLoaded(true);
      } 
      else if (appType === "upeg") {
        dispatch(setDataId("buyer"));
        setLoaded(true);
      }
      else{
        setLoaded(false);
      }
    }
    catch(e){
      console.error(e);
      setLoaded(false);
    }
  }, [searchParams]);

  if(!loaded) return <NotAuthenticated />;

  return (
    <Routes>
      <Route path="/" element={<BuyerBot />} />
    </Routes>
  );
}

export default App;