import { Component, OnInit, ViewChild } from '@angular/core';
import { TaxonomyService } from 'src/app/pages/dashboards/taxonomy.service';
import { Subscription, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { DashboardsService } from '../../../dashboards.service';
import { catchError, pluck, shareReplay, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AppService } from 'src/app/app.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimezoneService } from '../../../timezone.service';

interface Consumer {
  name: string;
  contract?: {
    startDate?: string;
  };
}

@Component({
  selector: 'app-dvir',
  templateUrl: './dvir.component.html',
  styleUrls: ['./dvir.component.scss']
})
export class DvirComponent implements OnInit {
  @ViewChild('nodatafound') nodatafound: any;
  @ViewChild('videoModal') videoModal: any;

  subscription$: Subscription = new Subscription();
  selectedMenuItem: string | null = null;
  fleetIdData: any;
  loginUser: any;
  user: any;
  multiRoles: any;
  consumerList: any;
  customConsumer: any;
  fleetList: any;
  consumer: any = 'All';
  currentDate: string = new Date().toISOString().split('T')[0];

  timePeriods = [
    { label: 'Today', value: 'today' },
    { label: 'Current Week', value: 'weekly' },
    { label: 'Current Month', value: 'monthly' },
    { label: 'Previous Month', value: 'lastmonth' },
    { label: 'Custom Range', value: 'customRange' },
  ];

  selectedPeriod: any;
  isCardOpen = false;
  loading: boolean = false;
  fromDate: string = '';
  toDate: string = '';
  selectedOption: string = 'customRange';

  vinList: any;
  selectedVin: string;

  dvirData: any[] = [];
  expandedRowIndex: number = -1;
  checklistItems: any[] = [];
  currentVideoUrl: string = '';
  videoModalRef: any;

  fleetIdValueNew: any;
  searchByConsumer: any;

  constructor(
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private appService: AppService,
    public router: Router,
    public http: HttpClient,
    private dashboardservice: TaxonomyService,
    private dashboardsService: DashboardsService,
    private timezoneService: TimezoneService
  ) {}

  ngOnInit() {
    this.selectedPeriod = 'weekly'; // Initialize with current week
    this.showRole();
    this.loadVinList();
    this.selectConsumers();
    this.loadChecklistItems();
    this.loadDvirData();
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
    if (this.user === 'role_user_fleet') {
      let fleetId = JSON.stringify(sessionStorage.getItem('fleetUserId'));
      this.fleetIdValueNew = JSON.parse(fleetId);
      this.fleetIdData = this.fleetIdValueNew;
    }
  }

  async getAllConsumerss() {
    try {
      const response = await this.dashboardservice
        .getAllConsumerss(this.customConsumer)
        .pipe(
          pluck("data"),
          catchError(() => of([])),
          shareReplay(1)
        )
        .toPromise();

      this.consumerList = (response as Consumer[]).filter((item) => item.contract).map((item) => ({
        name: item.name,
        startDate: this.formatDatedForActive(item.contract.startDate)
      }));

      const excludedConsumers = new Set([
        "Slick", "OneStep", "Arvind_insurance", "HD Fleet LLC", "GEICO",
        "Forward thinking GPS", "Geo Toll", "Matrack",
        "Geico", "Test fleet", "Rockingham", "Axiom", "GeoToll",
      ]);

      this.consumerList = this.consumerList.filter(item => !excludedConsumers.has(item.name));
      this.consumerList = this.consumerList.filter(item => item.name === this.customConsumer);
      this.consumerList.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error fetching consumers:", error);
    }
  }

  formatDatedForActive(dateString: string | Date): string {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  loadVinList(): void {
    const consumer = 'Smallboard';
    const fleetId = this.fleetIdData;
    const startDate = '';
    const endDate = '';

    this.dashboardservice.getManageListDownloadConsumers(consumer, fleetId, startDate, endDate)
      .subscribe({
        next: (response: any) => {
          if (Array.isArray(response)) {
            this.vinList = response.map((item) => ({
              vin: item.vin,
              alias: item.alias || item.vin
            }));
          }
        },
        error: (error) => {
          console.error('Error fetching VIN list:', error);
        }
      });
  }

  selectConsumers() {
    this.subscription$.add(
      this.dashboardservice.getFleetList(this.customConsumer).subscribe(
        (res: any) => {
          this.fleetList = res;
          this.fleetList = this.fleetList.sort((a, b) => {
            return a.id - b.id;
          });
          this.fleetIdData = null;
        },
        (err) => {}
      )
    );
  }

  selectFleetId() {
    this.loadVinList();
    this.loadDvirData();
    if (!this.searchByConsumer) {
      this.searchByConsumer = 'All';
    }
  }

  clearFleetSelection() {
    this.fleetIdData = null;
    this.loadDvirData();
  }

  filterByVin() {
    this.loadDvirData();
  }

  onTimePeriodChangeData(selectedPeriod: string): void {
    this.selectedPeriod = selectedPeriod;
    if (this.selectedPeriod === 'customRange') {
      this.isCardOpen = true;
    } else {
      this.isCardOpen = false;
      this.fromDate = '';
      this.toDate = '';
      this.loadDvirData();
    }
  }

  closeCard() {
    this.isCardOpen = false;
  }

  handleOption(option: string): void {
    this.selectedOption = option;
    this.selectedPeriod = this.timePeriods.find(period => period.value === option)?.value || '';
    this.onTimePeriodChangeData(this.selectedPeriod);
  }

  onDateRangeSelected(dateRange: { fromDate: string, toDate: string }): void {
    this.fromDate = dateRange.fromDate;
    this.toDate = dateRange.toDate;
    this.isCardOpen = false;
    this.loadDvirData();
  }

  private calculateDateRange(period: string): { startDate: string, endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch(period) {
      case 'today':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        ));
        endDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          23, 59, 59
        ));
        break;
      case 'weekly':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - now.getUTCDay()
        ));
        break;
      case 'monthly':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1
        ));
        endDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          0,
          23, 59, 59
        ));
        break;
      case 'lastmonth':
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() - 1,
          1
        ));
        endDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          0,
          23, 59, 59
        ));
        break;
      case 'customRange':
        if (this.fromDate && this.toDate) {
          startDate = new Date(`${this.fromDate}T00:00:00`);
          endDate = new Date(`${this.toDate}T23:59:59`);
        } else {
          // Default to today if custom range not set
          startDate = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
          ));
        }
        break;
      default:
        startDate = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate()
        ));
        break;
    }

    return {
      startDate: this.formatDateTime(startDate),
      endDate: this.formatDateTime(endDate)
    };
  }

  loadDvirData(): void {
    this.spinner.show();
    this.loading = true;

    const fleetId = this.fleetIdData || this.loginUser || '100224';
    const page = 0;
    const pageSize = 100;
    const vin = this.selectedVin || undefined;

    // Get date range based on selected period
    const { startDate, endDate } = this.calculateDateRange(this.selectedPeriod || 'weekly');

    // Pass startDate and endDate to API
    this.dashboardservice.getDVIRList(fleetId, page, pageSize, vin, undefined, undefined, startDate, endDate).subscribe({
      next: (response: any) => {
        if (response && response.data) {
          // Map data
          let filteredData = response.data.map((item: any) => ({
            dvirId: item.dvirId,
            dateTime: new Date(item.submittedAt),
            vin: item.vin,
            driver: item.driverName,
            overallStatus: item.allOk ? 'OK' : 'Fail',
            inspectionType: item.inspectionType,
            driverNotes: item.driverNotes,
            checklist: item.checklist,
            failedItems: item.failedItems || [],
            deviceLocation: item.deviceLocation,
            telematics: item.telematics,
            videoLink: item.videoUrl,
            linkingStatus: item.linkingStatus,
            linkedTripId: item.linkedTripId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            showAllComponents: false
          }));

          // API handles date filtering, no need for client-side filter
          this.dvirData = filteredData;

          if (this.dvirData.length === 0) {
            this.modalService.open(this.nodatafound, {
              centered: true,
              size: 'md',
              windowClass: 'modal-holder'
            });
          }
        } else {
          this.dvirData = [];
          this.modalService.open(this.nodatafound, {
            centered: true,
            size: 'md',
            windowClass: 'modal-holder'
          });
        }

        this.spinner.hide();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching DVIR data:', error);
        this.dvirData = [];
        this.spinner.hide();
        this.loading = false;
        this.toastr.error('Failed to load DVIR data', 'Error');
      }
    });
  }

  toggleExpand(index: number) {
    if (this.expandedRowIndex === index) {
      this.expandedRowIndex = -1;
    } else {
      this.expandedRowIndex = index;
    }
  }

  isVin(alias: string): boolean {
    const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinPattern.test(alias);
  }

  maskVin(vin: string): string {
    if (vin && vin.length >= 3) {
      return '**************' + vin.slice(-3);
    } else {
      return vin;
    }
  }

  loadChecklistItems(): void {
    this.dashboardservice.getDVIRChecklistItems().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.checklistItems = response;
        }
      },
      error: (error) => {
        console.error('Error fetching checklist items:', error);
      }
    });
  }

  viewDVIRDetail(dvirId: string): void {
    this.spinner.show();
    this.dashboardservice.getDVIRDetail(dvirId).subscribe({
      next: (response: any) => {
        console.log('DVIR Detail:', response);
        this.spinner.hide();
        // You can open a modal or navigate to a detail page here
      },
      error: (error) => {
        console.error('Error fetching DVIR detail:', error);
        this.spinner.hide();
        this.toastr.error('Failed to load DVIR details', 'Error');
      }
    });
  }

  openVideoModal(videoModal: any, videoUrl: string): void {
    if (videoUrl) {
      this.currentVideoUrl = videoUrl;
      this.videoModalRef = this.modalService.open(videoModal, {
        centered: true,
        size: 'xl',
        windowClass: 'video-modal'
      });
    } else {
      this.toastr.warning('Video not available', 'Warning');
    }
  }

  closeVideoModal(): void {
    if (this.videoModalRef) {
      this.currentVideoUrl = '';
      this.videoModalRef.close();
    }
  }

  getStatusClass(status: string): string {
    return status === 'Pass' ? 'badge-success' : 'badge-danger';
  }

  getInspectionTypeLabel(type: string): string {
    if (type === 'pre-trip') return 'Pre-Trip';
    if (type === 'post-trip') return 'Post-Trip';
    return type;
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  hasPassedItems(inspection: any): boolean {
    if (!inspection.checklist) return false;
    const items = Object.entries(inspection.checklist)
      .filter(([key]) => key !== 'Engine Oil' && key !== 'Seat Belts');
    return items.some(([, value]: [string, any]) =>
      value === true || value === 'true' || value === 'Pass' || value === 'pass'
    );
  }

  toggleShowAllComponents(inspection: any): void {
    inspection.showAllComponents = !inspection.showAllComponents;
  }

  openVideoModalByDvirId(videoModal: any, dvirId: string): void {
    if (!dvirId) {
      this.toastr.warning('DVIR ID not available', 'Warning');
      return;
    }

    this.spinner.show();
    this.dashboardservice.getDVIRVideoUrl(dvirId).subscribe({
      next: (response: any) => {
        this.spinner.hide();
        if (response && response.viewUrl) {
          this.currentVideoUrl = response.viewUrl;
          this.videoModalRef = this.modalService.open(videoModal, {
            centered: true,
            size: 'xl',
            windowClass: 'video-modal'
          });
        } else {
          this.toastr.warning('Video URL not available', 'Warning');
        }
      },
      error: (error) => {
        console.error('Error fetching video URL:', error);
        this.spinner.hide();
        this.toastr.error('Failed to load video', 'Error');
      }
    });
  }

  generateDVIRPDF(inspection: any): void {
    this.spinner.show();

    // Get address from coordinates
    const lat = inspection.deviceLocation?.latitude;
    const lng = inspection.deviceLocation?.longitude;

    if (lat && lng && lat !== -1 && lng !== -1) {
      this.timezoneService.getAddressFromLatLng(lat, lng).subscribe({
        next: (address) => {
          this.createPDF(inspection, address);
        },
        error: (error) => {
          console.error('Error fetching address:', error);
          this.createPDF(inspection, null);
        }
      });
    } else {
      this.createPDF(inspection, null);
    }
  }

  private createPDF(inspection: any, address: string | null): void {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DVIR - Driver Vehicle Inspection Report', 14, 20);

    // Add horizontal line
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);

    // Add inspection details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspection Information:', 14, 35);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let yPos = 42;

    const dateTimeStr = new Date(inspection.dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    doc.text(`Date & Time: ${dateTimeStr}`, 14, yPos);
    yPos += 7;

    // Add address if available
    if (address) {
      doc.text(`Location: ${address}`, 14, yPos);
      yPos += 7;
    }

    doc.text(`VIN: ${inspection.vin || 'N/A'}`, 14, yPos);
    yPos += 7;
    doc.text(`Driver: ${inspection.driver || 'N/A'}`, 14, yPos);
    yPos += 7;
    doc.text(`Inspection Type: ${this.getInspectionTypeLabel(inspection.inspectionType || 'N/A')}`, 14, yPos);
    yPos += 7;

    // Add overall status with color
    const displayStatus = inspection.overallStatus || 'N/A';
    const statusColor = inspection.overallStatus === 'OK' ? [34, 139, 34] : [220, 20, 60];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Status: ${displayStatus}`, 14, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPos += 10;

    // Add driver notes if available
    if (inspection.driverNotes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Driver Notes:', 14, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(inspection.driverNotes, 180);
      doc.text(splitNotes, 14, yPos);
      yPos += (splitNotes.length * 7) + 5;
    }

    // Add Physical Inspection checklist items table FIRST
    if (inspection.checklist && Object.keys(inspection.checklist).length > 0) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Physical Inspection:', 14, yPos);
      yPos += 5;

      // Filter out Engine Oil, Seat Belts, and Fuel Tank
      const checklistData = Object.entries(inspection.checklist)
        .filter(([component]) => component !== 'Engine Oil' && component !== 'Seat Belts' && component !== 'Fuel Tank')
        .map(([component, status]: [string, any]) => {
          const statusText = status === true || status === 'true' || status === 'Pass' || status === 'pass' ? 'OK' : 'Fail';
          return [component, statusText];
        });

      autoTable(doc, {
        startY: yPos,
        head: [['Component', 'Status']],
        body: checklistData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 100, halign: 'left' },
          1: { cellWidth: 80, halign: 'center', valign: 'middle' }
        },
        didParseCell: function(data) {
          if (data.section === 'head' && data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
          if (data.section === 'head' && data.column.index === 1) {
            data.cell.styles.halign = 'center';
          }
          if (data.section === 'body' && data.column.index === 1) {
            if (data.cell.text[0] === 'OK') {
              data.cell.styles.textColor = [34, 139, 34];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.text[0] === 'Fail') {
              data.cell.styles.textColor = [220, 20, 60];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add Telematics Data section SECOND
    if (inspection.telematics) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Telematics Data:', 14, yPos);
      yPos += 5;

      const telematicsData: any[] = [];

      // Odometer - Only Trip End
      if (inspection.telematics.odometerEnd !== undefined && inspection.telematics.odometerEnd !== -1) {
        telematicsData.push(['Odometer', `${inspection.telematics.odometerEnd.toFixed(2)} miles`]);
      } else {
        telematicsData.push(['Odometer', 'N/A']);
      }

      // Fuel Level Start
      // if (inspection.telematics.fuelLevelStart !== undefined && inspection.telematics.fuelLevelStart !== -1) {
      //   telematicsData.push(['Fuel Level Start', `${inspection.telematics.fuelLevelStart.toFixed(2)} gallons`]);
      // } else {
      //   telematicsData.push(['Fuel Level Start', 'N/A']);
      // }

      // Fuel Percent
      if (inspection.telematics.fuelPercent !== undefined && inspection.telematics.fuelPercent !== -1) {
        telematicsData.push(['Fuel Level', `${inspection.telematics.fuelPercent}%`]);
      } else {
        telematicsData.push(['Fuel Level', 'N/A']);
      }

      // Engine Oil Life
      if (inspection.telematics.engineOilLife !== undefined && inspection.telematics.engineOilLife !== -1) {
        telematicsData.push(['Engine Oil Life', `${inspection.telematics.engineOilLife}%`]);
      } else {
        telematicsData.push(['Engine Oil Life', 'N/A']);
      }

      // Battery Status
      if (inspection.telematics.batteryVoltage !== undefined && inspection.telematics.batteryVoltage !== -1) {
        telematicsData.push(['Battery Status', `${inspection.telematics.batteryVoltage.toFixed(2)} Volts`]);
      } else {
        telematicsData.push(['Battery Status', 'N/A']);
      }

      // Tire Pressure - Combined in one row
      if (inspection.telematics.tirePressure) {
        const tp = inspection.telematics.tirePressure;
        const pressures = [
          tp.frontRight ? tp.frontRight.toFixed(1) : 'N/A',
          tp.frontLeft ? tp.frontLeft.toFixed(1) : 'N/A',
          tp.rearLeft ? tp.rearLeft.toFixed(1) : 'N/A',
          tp.rearRight ? tp.rearRight.toFixed(1) : 'N/A'
        ];
        telematicsData.push(['Tire Pressure (FR/FL/RL/RR) in PSI', pressures.join(' / ')]);
      } else {
        telematicsData.push(['Tire Pressure (FR/FL/RL/RR) in PSI', 'N/A']);
      }

      // DTC (Diagnostic Trouble Codes)
      if (inspection.telematics.vehicleDtc && inspection.telematics.vehicleDtc.length > 0) {
        // Add each DTC as separate rows
        inspection.telematics.vehicleDtc.forEach((dtc: any, index: number) => {
          const category = dtc.category || 'No DTC';
          const code = dtc.code || 'No DTC';
          const description = dtc.description || 'N/A';

          if (index === 0) {
            telematicsData.push(['DTC Category', category]);
            telematicsData.push(['DTC Code', code]);
            telematicsData.push(['DTC Description', description]);
          } else {
            telematicsData.push([`DTC Category ${index + 1}`, category]);
            telematicsData.push([`DTC Code ${index + 1}`, code]);
            telematicsData.push([`DTC Description ${index + 1}`, description]);
          }
        });
      } else {
        telematicsData.push(['DTC Category', 'No DTC']);
        telematicsData.push(['DTC Code', 'No DTC']);
        telematicsData.push(['DTC Description', 'N/A']);
      }

      if (telematicsData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Parameter', 'Value']],
          body: telematicsData,
          theme: 'striped',
          headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: {
            fontSize: 9
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 80 }
          }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // Add failed items if any
    if (inspection.failedItems && inspection.failedItems.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(220, 20, 60);
      doc.text('Failed Components:', 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      const failedItemsData = inspection.failedItems.map((item: any) => [
        typeof item === 'string' ? item : item.component || item,
        typeof item === 'string' ? 'Requires attention' : item.notes || 'Requires attention',
        typeof item === 'string' ? 'Schedule maintenance' : item.action || 'Schedule maintenance'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Component', 'Notes', 'Action Required']],
        body: failedItemsData,
        theme: 'grid',
        headStyles: {
          fillColor: [220, 20, 60],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Open PDF in new tab instead of downloading
    const fileName = `DVIR_${inspection.vin}_${dateTimeStr.replace(/[,:\s]/g, '_')}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

    this.spinner.hide();
    this.toastr.success('DVIR report opened in new tab', 'Success');
  }

  private formatDateTime(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');

    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate())
    ].join('-') + 'T' + [
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds())
    ].join(':');
  }

  ngOnDestroy() {
    this.subscription$.unsubscribe();
    if (this.videoModalRef) {
      this.videoModalRef.close();
    }
  }
}
