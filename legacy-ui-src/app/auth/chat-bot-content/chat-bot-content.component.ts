import { Component, ElementRef, ViewChild, Input,SimpleChanges  } from '@angular/core';
import { finalize } from 'rxjs/operators';
import * as Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginapiService } from '../loginapi.service';

@Component({
  selector: 'app-chat-bot-content',
  templateUrl: './chat-bot-content.component.html',
  styleUrls: ['./chat-bot-content.component.scss']
})
export class ChatBotContentComponent {
  userInput = '';
  messageList: { text: string; sender: 'user' | 'bot' }[] = [];
  messages: Array<{ text: string; isUser: boolean; pdfFile?: File }> = [];
  data: any;
  user: any;
  users: any;
  quertInput: any;
  loginUser: any;
  multiRoles: any;
  customConsumer: any;
  userMessage: string = '';
  uploadedFileName: string = '';
  isTyping: boolean = false;
  extractedData: any[] = [];
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
 constructor(private modalService: NgbModal, public toastr: ToastrService, private loginService: LoginapiService,) { }

 handleSend(event: KeyboardEvent) {
  if (event.shiftKey) return; // Allow shift+enter for new lines

  event.preventDefault(); // Prevent default Enter behavior (like form submit)
  this.sendMessage();
}


  appendMessage(text: string, sender: 'user' | 'bot') {
    this.messageList.push({ text, sender });
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
   // File Upload and Data input in user input box
   uploadCSV(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadedFileName = file.name;

      Papa.parse(file, {
        complete: (result) => {
          if (result.data && result.data.length > 0) {
            let dataRows = result.data;

            // Remove header row if it contains "VIN"
            if (dataRows[0]?.[0]?.toLowerCase() === 'vin') {
              dataRows.shift();
            }

            // Extract VINs and store them in `this.extractedData`
            this.extractedData = dataRows
              .filter(row => row[0] && row[0].trim() !== '')
              .map(row => ({ vin: row[0].trim() }));
              if (this.extractedData.length === 0) {
              this.toastr.error("No VINs extracted from file.");
              return;
            }

            // Update user message
            this.userMessage = `${this.userMessage} 📎 ${this.uploadedFileName}`.trim();
          } else {
            this.toastr.error("Invalid CSV file. No VINs found.");
          }
        },
        header: false,
      });
    }
  }


  formatMessage(text: string): string {
    return text
      .replace(/\n\n/g, '<br><br>') // Preserve double line breaks for spacing
      .replace(/\n/g, '<br>') // Convert single new lines to `<br>`
      .replace(/\d+\.\s\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold OEM names (e.g., GM, STELLANTIS)
      .replace(/-\s(.*?)\n/g, '• $1<br>'); // Convert hyphens to bullet points
  }


  @Input() msg: any;

  displayedText: string = '';
  formattedDisplayedText: string = '';
  typingSpeed: number = 30;
ngOnChanges(changes: SimpleChanges): void {
    if (changes['msg'] && this.msg && !this.msg.isUser) {
      this.typeMessage(this.msg.text);
    }
  }
typeMessage(fullText: string) {
  this.isTyping = true;
  this.displayedText = '';
  this.formattedDisplayedText = '';
  let index = 0;

  const interval = setInterval(() => {
    this.displayedText += fullText.charAt(index);
    this.formattedDisplayedText = this.displayedText.replace(/\n/g, '<br>');
    index++;

    if (index >= fullText.length) {
      clearInterval(interval);
      this.isTyping = false;
      this.formattedDisplayedText = this.formatMessage(fullText);
    }
  }, this.typingSpeed);
}


  sendMessage() {
    const trimmedInput = this.userMessage.trim();
    const hasInput = trimmedInput !== '';
    const hasData = this.extractedData.length > 0;
    if (!hasInput && !hasData) {
      this.toastr.error('No data to send');
      return;
    }
    this.isTyping = true;
    let userMessageText = trimmedInput.replace(`${this.uploadedFileName}`, '').trim();
    let botMessageText = userMessageText;
    if (this.uploadedFileName) {
      botMessageText += `\n ${this.uploadedFileName}`;
    }
    this.messages.push({ text: botMessageText, isUser: true });
      let enrollData = {
        input: hasInput ? userMessageText : "",
        data: hasData ? this.extractedData : []
      };
      this.clearInputs();
      this.loginService.dataInsertion(enrollData).subscribe(
        (res: any) => {
          if (res?.output) {
            this.messages.push({ text: res.output, isUser: false });
            this.convertJsonToPdf(res);
          } else {
            this.messages.push({ text: 'Unexpected response from API.', isUser: false });
          }
        },
        (error) => {
          this.toastr.error(error?.error?.apierror?.message);
          this.messages.push({ text: 'API request failed. Please try again.', isUser: false });
          this.isTyping = false;
        }
      );
  }

  clearInputs() {
    this.userMessage = '';
    this.uploadedFileName = '';
    this.extractedData = [];
    this.isTyping = false;
  }
  // Convert Eligibility Report JSON to PDF & Download
  convertJsonToPdf(response: any) {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [250, 300],
    });
    const jsonData = response.data_out.bulk_summary;
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
    //Main heading
    doc.setFontSize(14);
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth("Bulk VIN Eligibility Report");
    const centerX = (pageWidth - textWidth) / 2;
    doc.text("Bulk VIN Eligibility Report", centerX, 10);
    // Main heading end
    // Time
    doc.setFontSize(10);
    doc.text(`Created on: ${timestamp}`, 10, 20);
    // Time end
    // Summary Table Start
    doc.setFontSize(12);
    const pageWidths = doc.internal.pageSize.getWidth();
    const textWidths = doc.getTextWidth("Summary");
    const centerXs = (pageWidths - textWidths) / 2;
    doc.text("Summary", centerXs, 30);
    const fieldMappings: { [key: string]: { label: string; description: string } } = {
      invalidCount: { label: "Invalid/Incorrect VINs", description: "VINs not as per NHTSA guidelines" },
      nonAddressableVinCount: { label: "Non Addressable VINs", description: "VINs outside supported OEMs" },
      totalVinCountUploaded: { label: "Total VINs Uploaded", description: "Total number of VINs provided" },
      duplicateVinCount: { label: "Duplicate VINs", description: "VINs with multiple entries" },
      cxMakeOemVinCount: { label: "Addressable VINs", description: "VINs part of supported OEMs" },
      totalEligibilityVinCount: { label: "Eligible VINs", description: "VINs eligible for data onboarding" },
      totalOemCompliantVinCount: { label: "Compliant VINs", description: "VINs within OEM compatibility guidelines" },
      nonCompliantVin: { label: "Non Compliant VINs", description: "VINs outside OEM compatibility" },
    };
    const summaryRows = [];
    Object.entries(jsonData).forEach(([key, value]) => {
      if (fieldMappings[key]) {
        summaryRows.push([
          fieldMappings[key].label,
          value !== null ? value : 0,
          fieldMappings[key].description,
        ]);
      }
    });
    autoTable(doc, {
      body: summaryRows,
      startY: 40,
      styles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        lineColor: [255, 255, 255],
        lineWidth: 0.1,
      },
      headStyles: {
        textColor: [0, 0, 0],
        fillColor: [217, 217, 217],
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          data.cell.styles.fillColor = data.row.index % 2 === 0 ? [217, 217, 217] : [242, 242, 242]; // Alternating row colors
        }
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 64, halign: "center" },
        2: { cellWidth: 110 },
      },
    });
    // Summary Table Start
    // OEM Split Table Start
    doc.setFontSize(12);
    const pageWidthOem = doc.internal.pageSize.getWidth();
    const textWidthOem = doc.getTextWidth("OEM Split");
    const centerXOem = (pageWidthOem - textWidthOem) / 2;
    doc.text("OEM Split", centerXOem, 104);
    if (jsonData.oem && jsonData.oem.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 40;
      const oemRows = jsonData.oem.map((oem) => [
        oem.cxMake,
        oem.compliantVinCount,
        oem.eligibilityVinCount,
      ]);
      autoTable(doc, {
        head: [["OEM", "Compliant VINs", "Eligible VINs"]],
        body: oemRows,
        startY: finalY + 10,
        styles: {
          fontSize: 9,
          textColor: [0, 0, 0],
          lineColor: [255, 255, 255],
          lineWidth: 0.1,
        },
        headStyles: {
          textColor: [0, 0, 0],
          fillColor: [250, 203, 171],
          fontSize: 10,
        },
        bodyStyles: {
          fillColor: [251, 227, 211],
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 91 },
          1: { cellWidth: 91 },
          2: { cellWidth: 91 },
        },
      });
      const newFinalY = (doc as any).lastAutoTable.finalY || finalY + 10;
      const totalCompliant = jsonData.oem.reduce((sum, o) => sum + o.compliantVinCount, 0);
      const totalEligible = jsonData.oem.reduce((sum, o) => sum + o.eligibilityVinCount, 0);
      autoTable(doc, {
        body: [["Total", totalCompliant, totalEligible]],
        startY: newFinalY,
        theme: "grid",
        bodyStyles: {
          fillColor: [196, 92, 20],
          textColor: [255, 255, 255],
          fontSize: 9,
        },
        styles: {
          fontSize: 9,
          fontStyle: "bold",
          textColor: [0, 0, 0],
          lineColor: [255, 255, 255],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 91 },
          1: { cellWidth: 91 },
          2: { cellWidth: 91 },
        },
      });
    }
    // OEM Split Table End
    // VINs Detail Table Start
    const vinData = response?.data_out?.resoponse || [];
    if (vinData.length > 0) {
      // Map response to table format
      const vinRows = vinData.map((vin) => [
        vin.vin,
        vin.make,
        vin.model,
        vin.trim,
        vin.year,
        vin.status,
        vin.validationFailureReason,
        vin.action,
        vin.serviceCodes,
        vin.vehicleFleetType,
      ]);
      const finalYOem = (doc as any).lastAutoTable.finalY || 104;
      autoTable(doc, {
        head: [["VIN", "Make", "Model", "Trim", "Year", "Eligibility Status", "Validation Failure Reason", "Action", "Service Code", "Vehicle Fleet Type"]],
        body: vinRows,
        startY: finalYOem + 20,
        styles: {
          fontSize: 9,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          textColor: [0, 0, 0],
          fillColor: [217, 217, 217],
          fontSize: 10,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          fontSize: 9,
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 40 },
          6: { cellWidth: 40 },
          7: { cellWidth: 20 },
          8: { cellWidth: 20 },
          9: { cellWidth: 25 },
        },
      });
    }
    // VINs Detail Table End
    // File Download Name
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], "vin_eligibility_report.pdf", { type: "application/pdf" });
    this.messages.push({ text: "Eligibility report is ready for download", isUser: false, pdfFile });
    // File Download Name End
  }
  downloadPdf(pdfFile: File) {
    const url = URL.createObjectURL(pdfFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }
  // if need will do remove session of chat history
  removeSession() {
    const sessionId = this.users;
    const welcomeMessageIndex = this.messages.findIndex(message => message.text === 'Hi there! Thank you for visiting our FleetTrack portal. How can I help you today?');
    this.messages.splice(welcomeMessageIndex + 1);
    this.loginService.removeSession(sessionId).pipe(finalize(() => {
    })
    )
      .subscribe((response) => {
      },
        (error) => {
        }
      );
  }
}
