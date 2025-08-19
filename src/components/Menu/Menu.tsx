import React, { useState } from "react";
import * as AppGeneral from "../socialcalc/index.js";
import { File, Local } from "../Storage/LocalStorage";
import { isPlatform, IonToast } from "@ionic/react";
import { EmailComposer } from "capacitor-email-composer";
// import { Printer } from "@awesome-cordova-plugins/printer";
import { IonAlert, IonPopover, IonList, IonItem, IonIcon, IonLabel, IonButton } from "@ionic/react";
// For PDF generation
import type { jsPDF } from 'jspdf';
import 'jspdf/dist/polyfills.es';
import { 
  saveOutline, 
  save, 
  mail, 
  print, 
  logInOutline, 
  logOutOutline, 
  documentOutline, 
  shareOutline, 
  cloudDownloadOutline, 
  lockClosedOutline, 
  arrowUndoOutline, 
  arrowRedoOutline,
  // Professional government icons
  refreshOutline,
  returnUpBackOutline,
  saveSharp,
  documentTextOutline,
  shieldCheckmarkOutline,
  downloadOutline,
  documentSharp,
  shareSharp,
  printOutline,
  mailOutline
} from "ionicons/icons";
import { APP_NAME } from "../../app-data.js";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import { useHistory } from "react-router-dom";

const Menu: React.FC<{
  showM: boolean;
  setM: Function;
  file: string;
  updateSelectedFile: Function;
  store: Local;
  bT: number;
  triggerEvent?: Event;
}> = (props) => {
  const [showAlert1, setShowAlert1] = useState(false);
  const [showAlert3, setShowAlert3] = useState(false);
  const [showAlert4, setShowAlert4] = useState(false);
  const [showAlert5, setShowAlert5] = useState(false); // For password-protected save
  const [showToast1, setShowToast1] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { currentUser } = useAuth();
  const history = useHistory();

  // Undo/Redo Functions
  const handleUndo = () => {
    try {
      AppGeneral.undo();
      setToastMessage("Undo successful");
      setShowToast1(true);
    } catch (error) {
      setToastMessage("Cannot undo");
      setShowToast1(true);
    }
  };

  const handleRedo = () => {
    try {
      AppGeneral.redo();
      setToastMessage("Redo successful");
      setShowToast1(true);
    } catch (error) {
      setToastMessage("Cannot redo");
      setShowToast1(true);
    }
  };
  /* Utility functions */
  const _validateName = async (filename) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      setToastMessage("Cannot update default file!");
      return false;
    } else if (filename === "" || !filename) {
      setToastMessage("Filename cannot be empty");
      return false;
    } else if (filename.length > 30) {
      setToastMessage("Filename too long");
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      setToastMessage("Special Characters cannot be used");
      return false;
    } else if (await props.store._checkKey(filename)) {
      setToastMessage("Filename already exists");
      return false;
    }
    return true;
  };

  const getCurrentFileName = () => {
    return props.file;
  };

  // Authentication functions
  const handleLogin = () => {
    history.push('/auth');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setToastMessage("Logged out successfully!");
      setShowToast1(true);
    } catch (error: any) {
      setToastMessage("Logout failed: " + error.message);
      setShowToast1(true);
    }
  };

  const _formatString = (filename) => {
    /* Remove whitespaces */
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  };

  const doPrint = () => {
    if (isPlatform("hybrid")) {
      // For mobile, use window.print() as fallback
      // Printer plugin will be added later after proper installation
      console.log("Mobile print requested");
      window.print();
    } else {
      const content = AppGeneral.getCurrentHTMLContent();
      // useReactToPrint({ content: () => content });
      const printWindow = window.open("/printwindow", "Print Invoice");
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.print();
      } else {
        setToastMessage("Failed to open print window");
        setShowToast1(true);
      }
    }
  };
  const doSave = async () => {
    if (props.file === "default") {
      setShowAlert1(true);
      return;
    }
    try {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const data = await props.store._getFile(props.file);
      const file = new File(
        (data as any).created,
        new Date().toString(),
        content,
        props.file,
        props.bT
      );
      await props.store._saveFile(file);
      props.updateSelectedFile(props.file);
      setToastMessage(`File "${props.file}" saved successfully!`);
      setShowToast1(true);
    } catch (error) {
      setToastMessage("Error saving file");
      setShowToast1(true);
    }
  };

  const doSaveAs = async (filename) => {
    // event.preventDefault();
    if (filename) {
      // console.log(filename, _validateName(filename));
      if (await _validateName(filename)) {
        // filename valid . go on save
        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
        // console.log(content);
        const file = new File(
          new Date().toString(),
          new Date().toString(),
          content,
          filename,
          props.bT
        );
        // const data = { created: file.created, modified: file.modified, content: file.content, password: file.password };
        // console.log(JSON.stringify(data));
        props.store._saveFile(file);
        props.updateSelectedFile(filename);
        setShowAlert4(true);
      } else {
        setShowToast1(true);
      }
    }
  };

  const saveAsPassword = async (alertData) => {
    const { filename, password, confirmPassword } = alertData;
    
    if (!filename || !password || !confirmPassword) {
      setToastMessage("All fields are required");
      setShowToast1(true);
      return;
    }
    
    if (password !== confirmPassword) {
      setToastMessage("Passwords do not match");
      setShowToast1(true);
      return;
    }
    
    if (password.length < 4) {
      setToastMessage("Password must be at least 4 characters long");
      setShowToast1(true);
      return;
    }
    
    if (await _validateName(filename)) {
      const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
      const file = new File(
        new Date().toString(),
        new Date().toString(),
        content,
        filename,
        props.bT,
        password
      );
      
      try {
        await props.store._saveFile(file);
        props.updateSelectedFile(filename);
        setToastMessage(`Password-protected file "${filename}" saved successfully`);
        setShowToast1(true);
      } catch (error) {
        setToastMessage("Failed to save password-protected file");
        setShowToast1(true);
      }
    } else {
      setShowToast1(true);
    }
  };

  const sendEmail = () => {
    if (isPlatform("hybrid")) {
      const content = AppGeneral.getCurrentHTMLContent();
      const base64 = btoa(content);

      EmailComposer.open({
        to: ["jackdwell08@gmail.com"],
        cc: [],
        bcc: [],
        body: "PFA",
        attachments: [{ type: "base64", path: base64, name: "Invoice.html" }],
        subject: `${APP_NAME} attached`,
        isHtml: true,
      });
    } else {
      alert("This Functionality works on Android/iOS devices");
    }
  };

  // CSV Export Function
  const exportAsCsv = async () => {
    try {
      const content = AppGeneral.getCurrentHTMLContent();
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const table = doc.querySelector('table');
      
      if (!table) {
        setToastMessage("No data to export");
        setShowToast1(true);
        return;
      }

      let csvContent = "";
      const rows = table.querySelectorAll('tr');
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td, th');
        const rowData = Array.from(cells).map(cell => {
          // Replace commas and quotes in cell content to avoid CSV issues
          let content = cell.textContent || '';
          content = content.replace(/"/g, '""');
          if (content.includes(',')) {
            content = `"${content}"`;
          }
          return content;
        });
        csvContent += rowData.join(',') + '\\n';
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${getCurrentFileName() || 'export'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToastMessage("CSV exported successfully!");
      setShowToast1(true);
    } catch (error) {
      console.error('CSV Export error:', error);
      setToastMessage("Failed to export CSV");
      setShowToast1(true);
    }
  };

  // Simple PDF Export - Just capture what's visible as is
  const exportAsPDF = async (option: string = 'download') => {
    try {
      // Get the content
      const content = AppGeneral.getCurrentHTMLContent();
      if (!content) {
        throw new Error('No content to export');
      }

      // Import libraries
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      // Create a temporary div with the invoice content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      tempDiv.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        background: white;
        padding: 10px;
        width: 800px;
      `;
      
      document.body.appendChild(tempDiv);

      // Wait a moment for rendering
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture exactly what's visible
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });

      // Remove temp div
      document.body.removeChild(tempDiv);

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add image centered on page
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center image on page
      const yPos = Math.max(10, (pdfHeight - imgHeight) / 2);
      
      // Add the image to PDF
      pdf.addImage(imgData, 'JPEG', 10, yPos, imgWidth, imgHeight);
      
      // Save or return for sharing
      if (option === 'download') {
        const filename = `${getCurrentFileName() || 'invoice'}.pdf`;
        pdf.save(filename);
        setToastMessage('PDF exported successfully!');
      }
      
      // Save or return for sharing
      if (option === 'download') {
        const filename = `${getCurrentFileName() || 'invoice'}.pdf`;
        pdf.save(filename);
        setToastMessage('PDF exported successfully!');
      }
      
      setShowToast1(true);
      return pdf;
    } catch (error) {
      console.error('PDF Export error:', error);
      setToastMessage(error.message || "Failed to export PDF");
      setShowToast1(true);
      return null;
    }
  };  // Share PDF Function
  const share = async () => {
    try {
      if (!isPlatform('hybrid')) {
        setToastMessage("Sharing is only available on mobile devices");
        setShowToast1(true);
        return;
      }

      // Generate PDF first
      const pdf = await exportAsPDF('share');
      if (!pdf) {
        throw new Error('Failed to generate PDF');
      }

      // Convert PDF to base64
      const pdfBase64 = pdf.output('datauristring');
      const shareData = {
        title: `${getCurrentFileName() || 'Invoice'}.pdf`,
        text: 'Check out this invoice generated with our app!',
        url: pdfBase64,
        dialogTitle: 'Share Invoice'
      };

      try {
        const { Share } = await import('@capacitor/share');
        await Share.share(shareData);
        setToastMessage("PDF shared successfully!");
      } catch (shareError) {
        console.error('Share error:', shareError);
        setToastMessage("Failed to share PDF");
      }
    } catch (error) {
      console.error('Share function error:', error);
      setToastMessage("Failed to prepare PDF for sharing");
    }
    setShowToast1(true);
  };

  return (
    <React.Fragment>
      {/* Header Popover Menu */}
      <IonPopover
        isOpen={props.showM}
        event={props.triggerEvent}
        onDidDismiss={() => props.setM()}
        showBackdrop={true}
        keyboardClose={true}
      >
        <IonList style={{ minWidth: '200px' }}>
          {/* Edit Operations */}
          <IonItem button onClick={() => { handleUndo(); props.setM(); }}>
            <IonIcon icon={returnUpBackOutline} slot="start" color="medium" />
            <IonLabel>Undo</IonLabel>
          </IonItem>
          
          <IonItem button onClick={() => { handleRedo(); props.setM(); }}>
            <IonIcon icon={refreshOutline} slot="start" color="medium" />
            <IonLabel>Redo</IonLabel>
          </IonItem>
          
          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 16px' }}></div>
          
          {/* File Operations */}
          <IonItem button onClick={() => { doSave(); props.setM(); }}>
            <IonIcon icon={saveSharp} slot="start" color="primary" />
            <IonLabel>Save</IonLabel>
          </IonItem>
          
          <IonItem button onClick={() => { setShowAlert3(true); props.setM(); }}>
            <IonIcon icon={saveOutline} slot="start" color="primary" />
            <IonLabel>Save As</IonLabel>
          </IonItem>
          
          <IonItem button onClick={() => { setShowAlert5(true); props.setM(); }}>
            <IonIcon icon={shieldCheckmarkOutline} slot="start" color="warning" />
            <IonLabel>Save Protected</IonLabel>
          </IonItem>
          
          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 16px' }}></div>
          
          {/* Export Operations */}
          <IonItem button onClick={() => { exportAsCsv(); props.setM(); }}>
            <IonIcon icon={downloadOutline} slot="start" color="success" />
            <IonLabel>Export CSV</IonLabel>
          </IonItem>
          
          <IonItem button onClick={() => { exportAsPDF('download'); props.setM(); }}>
            <IonIcon icon={documentSharp} slot="start" color="danger" />
            <IonLabel>Export PDF</IonLabel>
          </IonItem>
          
          <IonItem button onClick={() => { share(); props.setM(); }}>
            <IonIcon icon={shareSharp} slot="start" color="tertiary" />
            <IonLabel>Share PDF</IonLabel>
          </IonItem>
          
          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 16px' }}></div>
          
          {/* Communication Operations */}
          <IonItem button onClick={() => { doPrint(); props.setM(); }}>
            <IonIcon icon={printOutline} slot="start" color="medium" />
            <IonLabel>Print</IonLabel>
          </IonItem>
          
          <IonItem button onClick={() => { sendEmail(); props.setM(); }}>
            <IonIcon icon={mailOutline} slot="start" color="primary" />
            <IonLabel>Email</IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Alert Message"
        message={
          "Cannot update <strong>" + getCurrentFileName() + "</strong> file!"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert3}
        onDidDismiss={() => setShowAlert3(false)}
        header="Save As"
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
        ]}
        buttons={[
          {
            text: "Ok",
            handler: (alertData) => {
              doSaveAs(alertData.filename);
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert4}
        onDidDismiss={() => setShowAlert4(false)}
        header="Save As"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> saved successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert5}
        onDidDismiss={() => setShowAlert5(false)}
        header="Save as Password Protected"
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
          { name: "password", type: "password", placeholder: "Enter password" },
          { name: "confirmPassword", type: "password", placeholder: "Confirm password" },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Save",
            handler: (alertData) => {
              saveAsPassword(alertData);
            },
          },
        ]}
      />
      <IonToast
        animated
        isOpen={showToast1}
        onDidDismiss={() => {
          setShowToast1(false);
          setShowAlert3(true);
        }}
        position="bottom"
        message={toastMessage}
        duration={500}
      />
    </React.Fragment>
  );
};

export default Menu;
