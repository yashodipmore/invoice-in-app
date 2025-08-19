import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonPopover,
  IonTitle,
  IonToolbar,
  IonToast,
  IonToggle,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { APP_NAME, DATA } from "../app-data";
import * as AppGeneral from "../components/socialcalc/index.js";
import { useEffect, useState } from "react";
import { Local } from "../components/Storage/LocalStorage";
import { settings, personCircleOutline, personRemoveOutline, cartOutline, menuOutline, reorderThreeOutline, gridOutline } from "ionicons/icons";
import "./Home.css";
import Menu from "../components/Menu/Menu";
import Files from "../components/Files/Files";
import NewFile from "../components/NewFile/NewFile";
import { useAutoSave } from "../hooks/useAutoSave";
import { useAuth } from "../contexts/AuthContext";
import { useHistory } from "react-router-dom";
import { authService } from "../services/authService";

const Home: React.FC = () => {
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [headerMenuEvent, setHeaderMenuEvent] = useState<Event | undefined>(undefined);
  const [showPopover, setShowPopover] = useState<{
    open: boolean;
    event: Event | undefined;
  }>({ open: false, event: undefined });
  const [selectedFile, updateSelectedFile] = useState("default");
  const [billType, updateBillType] = useState(1);
  const [device] = useState("default");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { currentUser } = useAuth();
  const history = useHistory();

  const store = new Local();

  // Auto-save hook with fixed 15-second interval and no notifications
  const { startAutoSave, stopAutoSave } = useAutoSave(
    store,
    selectedFile,
    billType,
    {
      intervalMs: 15000, // 15 seconds fixed
      enabled: selectedFile !== "default", // Always enabled except for default file
      onSave: () => {
        // Silent auto-save, no notifications
      },
      onError: (error) => {
        // Only show critical errors
        if (error.includes("critical")) {
          setToastMessage(error);
          setShowToast(true);
        }
      }
    }
  );

  const closeHeaderMenu = () => {
    setShowHeaderMenu(false);
  };

  const handleHeaderMenuClick = (e: any) => {
    setHeaderMenuEvent(e.nativeEvent);
    setShowHeaderMenu(true);
  };

  const activateFooter = (footer) => {
    AppGeneral.activateFooterButton(footer);
  };

  // Authentication handlers
  const handleLogin = () => {
    history.push('/auth');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setToastMessage("Logged out successfully!");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage("Logout failed: " + error.message);
      setShowToast(true);
    }
  };

  const handleInAppPurchase = () => {
    history.push('/inapp-purchase');
  };

  useEffect(() => {
    const data = DATA["home"][device]["msc"];
    AppGeneral.initializeApp(JSON.stringify(data));
  }, []);

  useEffect(() => {
    activateFooter(billType);
  }, [billType]);

  const footers = DATA["home"][device]["footers"];
  const footersList = footers.map((footerArray) => {
    return (
      <IonButton
        key={footerArray.index}
        expand="full"
        color="light"
        className="ion-no-margin"
        onClick={() => {
          updateBillType(footerArray.index);
          activateFooter(footerArray.index);
          setShowPopover({ open: false, event: undefined });
        }}
      >
        {footerArray.name}
      </IonButton>
    );
  });

  return (
    <IonPage>
      <IonHeader>
        {/* Top Header - App Name Only */}
        <IonToolbar color="primary">
          <IonTitle style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 'bold' }}>
            {APP_NAME}
          </IonTitle>
        </IonToolbar>
        
        {/* Second Header - Navigation Icons */}
        <IonToolbar color="secondary" style={{ minHeight: '56px' }}>
          {/* Left side - File operations */}
          <Files
            store={store}
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
            updateBillType={updateBillType}
          />

          <NewFile
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
            store={store}
            billType={billType}
          />

          {/* Right side - User actions (proper sequence) */}
          <IonIcon
            icon={currentUser ? personRemoveOutline : personCircleOutline}
            slot="end"
            className="ion-padding-end auth-icon"
            size="medium"
            onClick={currentUser ? handleLogout : handleLogin}
            style={{ 
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.1em'
            }}
            title={currentUser ? "Logout" : "Login"}
          />
          
          <IonIcon
            icon={cartOutline}
            slot="end"
            className="ion-padding-end"
            size="medium"
            onClick={handleInAppPurchase}
            style={{ 
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.1em'
            }}
            title="In-App Purchase"
          />
          
          <IonIcon
            icon={settings}
            slot="end"
            className="ion-padding-end"
            size="medium"
            onClick={(e) => {
              setShowPopover({ open: true, event: e.nativeEvent });
            }}
            style={{ 
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.1em'
            }}
            title="Bill Type Settings"
          />
          
          {/* Main Menu - Last position (professional standard) */}
          <IonIcon
            icon={menuOutline}
            slot="end"
            className="ion-padding-end header-menu-icon"
            size="medium"
            onClick={handleHeaderMenuClick}
            style={{ 
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.2em',
              fontWeight: 'bold'
            }}
            title="File Operations Menu"
          />
          
          <IonPopover
            animated
            keyboardClose
            backdropDismiss
            event={showPopover.event}
            isOpen={showPopover.open}
            onDidDismiss={() =>
              setShowPopover({ open: false, event: undefined })
            }
          >
            <div style={{ padding: '10px' }}>
              {footersList}
            </div>
          </IonPopover>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonToolbar color="secondary">
          <IonTitle className="ion-text-center">
            Editing : {selectedFile}
            {selectedFile !== 'default' && (
              <div style={{ fontSize: '11px', color: 'white', marginTop: '2px', opacity: 0.9 }}>
                Auto-save enabled
              </div>
            )}
          </IonTitle>
        </IonToolbar>

        {/* Header Menu (Only menu needed) */}
        <Menu
          showM={showHeaderMenu}
          setM={closeHeaderMenu}
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
          store={store}
          bT={billType}
          triggerEvent={headerMenuEvent}
        />

        <div id="container">
          <div id="workbookControl"></div>
          <div id="tableeditor"></div>
          <div id="msg"></div>
        </div>
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          color={toastMessage.includes('successful') ? 'success' : 
                 toastMessage.includes('Auto-saved') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
