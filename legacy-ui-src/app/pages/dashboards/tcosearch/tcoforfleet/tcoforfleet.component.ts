import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { TaxonomyService } from '../../taxonomy.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Options } from 'ng5-slider';
import { ActivatedRoute, Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { AppService } from 'src/app/app.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexMarkers,
  ApexYAxis,
  ApexGrid,
  ApexTitleSubtitle,
  ApexLegend
} from "ng-apexcharts";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  tooltip: any; // ApexTooltip;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-tcoforfleet',
  templateUrl: './tcoforfleet.component.html',
  styleUrls: ['./tcoforfleet.component.scss']
})
export class TcoforfleetComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  btnstatusByStatus: boolean;
  Isdisabled: boolean = true
  fleetIdData: any;
  compareVin: any;
  makeIdData: '';
 fuelIdData: any = null
 stateIdData: any = null
  modelIdData: any = null;
  yearIdData: any = null;
  companyIdData: any = null;
  btnstatus: boolean = false;
  statusBtn: boolean = true;
  fuel: boolean = false
  toggle = true
  temp: any;
  stellantisUs: any;
  vins: any;
  vehicleData: any;
  compareFleetId: any
  selectVinOption: boolean = false
  oem: any;
  profileVehicle: any;
  providerData: any[];
  provderList: any[];
  selectedCost: string = 'total';
  selectoem: any = '';
  getstellantisVin: any;
  oemVin: any = ''
  detailStatus: boolean = false
  @ViewChild("largeNoDataFound") modalContent: TemplateRef<any>;
  @ViewChild("fleetlargeNoDataFound") modelContent1: TemplateRef<any>;
  @ViewChild("dataList") modelContent2: TemplateRef<any>;
  detailsofTco: boolean = false
  enable: boolean = false;
  costData: any;
  NewCostData: any;
  depreciation: boolean = false
  fuelcosts: boolean = true;
  maitenance: boolean = false;
  others: boolean = false;
  internalServer: boolean = false;
  internalServer1: boolean = true;
  value: number = 0;
  options: Options = {
    floor: 0,
    ceil: 10,
    step: 0.01,
    disabled: true,
  };
  chartOptions: any;
  sub: any;
  totalMilesCost: any;
  gallonCost: any;
  mileagePerMile: any
  averageCostMile: any
  vehicleCost: any;
  hide: boolean = false
  averageHide: boolean = true;
  vehiclHealth: any = 'good'
  maintenanceRepairCost: any;
  insuranceCost: number;
  milesPerCost: any;
  maintenanceCosts: any;
  repairCost: any;
  depreciationCost: any;
  fleetId: any
  totalAnnualCost: any;
  tollFee: number = 0;
  mainteannceCost: number;
  sortOrder = 'asc'
  nowOpen: boolean = false;
  stateTax: number;
  VehicleWithdepreciationCost: any;
  VINsummary: any;
  avergeFuelCost: any;
  annualFueldollarpermiles: any;
  depriciationAnuualMiles: any;
  totalFuelConsumed: any;
  annualDepriciationCostperdoller: number;
  fleetSummary: any = []
  depricationCostMain: number;
  miles: any;
  totalFuelConsumedData: any;
  mainCostAnnaual: any;
  mySubscription
  othersCost: number;
  consumer: any = 'All'
  selectFleetOption: boolean = false;
  depriCost: any;
  MilesCost: any;
  modelList: any = [];
  noofVehicles: any;
  totalFuelCost: number;
  status = "Enable";
  costpergallon: number;
  mileages: number;
  costPerGallonData: number;
  VehicleWithdepreciationCosts: number;
  mainteannceCosts: number;
  mileagePerMileFleet: any;
  MilesCostCal: any;
  fleetList: any;
  compareFleetData: any;
  currentYear: any = new Date().getFullYear()
  projectionCategoryData = [this.currentYear, this.currentYear + 1, this.currentYear + 2]
  yearList: any = [];
  makeList: any = [];
  fuelList: any = []
  chartOptionstco: any
  chartOptionsvin: any
  chartOptionsMileage: any
  chartOptionsDepriciation: any
  chartOptionsMaintenance: any
  chartOptionsFuelCost: any
  chartIndex: any = 3
  allTco: any = {
    fuelCost: 0,
    depreciationCost: 0,
    maintenanceCost: 0,
    insuranceCost: 0,
    stateCost: 0,
    annualMileData: 0,
    annualChartData: 0
  };
  tcoChartData: any = { fuelData: [], depreciationData: [], maintenanceData: [], insuranceData: [], stateData: [], annualChartData: [], annualMileData: [], fuelMileData: [], depreciationMileData: [], maintenanceMileData: [], insuranceMileData: [], stateMileData: [] };
  tcoVinList: any;
  totalDistanceTravelled: any;
  multiRoles: any;
  user: any;
  customConsumer: any;
  constructor(private appService: AppService,private modalService: NgbModal, private spinner: NgxSpinnerService, private route: ActivatedRoute, private router: Router, private userService: TaxonomyService, private http: HttpClient) {
    this.averageCost()
  }

  averageCost() {
    this.selectedCost = 'average';
    this.chartTcoForVINs()
    this.chartAnnualProjections([], [])
    this.chartDepriciations([], [])
    this.chartMaintenances([])
    this.chartInsurances([])
    this.chartStateTaxs([])
    this.chartFuelCostProjections([], [])
    this.getFuelCost(this.VINsummary)
  }

  async totalCost() {
    this.selectedCost = 'total';
    await this.fetchData();
    this.chartTcoForVIN()
    this.chartAnnualProjection([], [])
    this.chartDepriciation([], [])
    this.chartMaintenance([])
    this.chartInsurance([])
    this.chartStateTax([])
    this.chartFuelCostProjection([], [])
  }

  viewMore(): void {
    if (this.consumer && this.consumer !== 'All') {
      this.router.navigate(['/adlp/admin/manageVehicle'], { queryParams: { consumer: this.consumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/manageVehicle']);
    }
  }

  showRole() {
    let userRolLogin = JSON.stringify(sessionStorage.getItem('userRole'));
    this.user = JSON.parse(userRolLogin);
    this.multiRoles = JSON.parse(sessionStorage.getItem('multiRole'));
    let customConsumers = JSON.stringify(sessionStorage.getItem('custom-consumer'));
    this.customConsumer = JSON.parse(customConsumers);
  }


  async fetchData() {
    try {
      this.chartTcoForVIN()
      this.chartAnnualProjection([], [])
      this.chartDepriciation([], [])
      this.chartMaintenance([])
      this.chartInsurance([])
      this.chartStateTax([])
      this.chartFuelCostProjection([], [])
    } catch (error) {
    }
  }

  calculateTotalCost(chartIndex: number): string {
    const tcoChartData = this.tcoChartData;
    const allTco = this.allTco;
    const fuelCost = chartIndex !== 3 ? (tcoChartData?.fuelData[chartIndex]) : (allTco?.fuelCost );
    const depreciationCost = chartIndex !== 3 ? (tcoChartData?.depreciationData[chartIndex]) : (allTco?.depreciationCost);
    const maintenanceCost = chartIndex !== 3 ? (tcoChartData?.maintenanceData[chartIndex] ) : (allTco?.maintenanceCost);
    const insuranceCost = chartIndex !== 3 ? (tcoChartData?.insuranceData[chartIndex]) : (allTco?.insuranceCost);
    const stateCost = chartIndex !== 3 ? (tcoChartData?.stateData[chartIndex]) : (allTco?.stateCost);
    const totalCost = fuelCost + depreciationCost + maintenanceCost + insuranceCost + stateCost;
    return totalCost.toFixed(2);
  }

  getFormattedTotalCost(chartIndex: number): string {
    // Calculate the total cost and convert it to a number
    const totalCost = Number(this.calculateTotalCost(chartIndex));

    // Check if the total cost is NaN or 0, and return '0.00' if true
    if (isNaN(totalCost) || totalCost === 0) {
      return '0.00';
    }

    // Convert the total cost to a string with two decimal places
    const formattedCost = totalCost.toFixed(2);

    // Split the cost into integer and decimal parts
    const parts = formattedCost.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // Format the integer part with commas according to the Indian numbering system
    let lastThreeDigits = integerPart.slice(-3);
    const otherDigits = integerPart.slice(0, -3);

    if (otherDigits) {
      lastThreeDigits = ',' + lastThreeDigits;
    }

    const formattedNumber = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThreeDigits;

    // Return the formatted number with the decimal part
    return formattedNumber + decimalPart;
  }

  calculateTotalCostall(chartIndex: number): string {
    const noofVehicles = this.noofVehicles;
    const tcoChartData = this.tcoChartData;
    const allTco = this.allTco;
    const fuelCost = chartIndex !== 3 ? (allTco?.fuelCost / noofVehicles) : (tcoChartData?.fuelData[chartIndex] / noofVehicles);
    const depreciationCost = chartIndex !== 3 ?(allTco?.depreciationCost) : (tcoChartData?.depreciationData[chartIndex])
    const maintenanceCost = chartIndex !== 3 ? (allTco?.maintenanceCost) : (tcoChartData?.maintenanceData[chartIndex] );
    const insuranceCost = chartIndex !== 3 ?  (allTco?.insuranceCost) : (tcoChartData?.insuranceData[chartIndex]);
    const stateCost = chartIndex !== 3 ?  (allTco?.stateCost) : (tcoChartData?.stateData[chartIndex])
    const totalCost = fuelCost + depreciationCost + maintenanceCost + insuranceCost + stateCost;
    return totalCost.toFixed(2);
  }


  getTotalCount(): number {
    return this.fleetSummary.reduce((sum, item) => sum + (item?.count || 0), 0);
  }

  countValuesAfterDoubleComma(input: string): number {
    const parts = input.split(',,');
    let count = 0;
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].trim() !== '') {
        count++;
      }
    }
    return count;
  }

  ngOnInit(): void {
    this.getVin()
    this.getAllProvider()
    this. showRole()

  }
  ngAfterViewInit() {
    this.chartOptionstco
  }

  // Chart for New TCO FLEET //
  chartAnnualProjection(mileData, categoriesData) {
    // Divide annualData by 100
    let annualChartData = this.costData?.totalCostAnnualProjection
      ? Object.values(this.costData?.totalCostAnnualProjection).slice(0, 3)
        .map((item: any) => Number((Number(item)).toFixed(2)))
      : [];
      let annualCostNew = this.costData?.totalCostAnnualProjection
      ? Object.values(this.costData.totalCostAnnualProjection)
          .slice(0, 3)
          .map((item: any) => {
            let value = Number(item) /  (this.costData?.totalDistanceOfCurrentYear)
            let roundedValue = parseFloat(value.toFixed(2));
            return roundedValue === 0 ? 0.01 : roundedValue; // Ensure non-zero minimum
          })
      : [];

    // Find max values
    // const maxAnnualData = Math.max(...annualData);
    const maxAnnualCostNew = Math.max(...annualCostNew);
    const maxAnnualData = Math.max(...annualChartData);
    const maxValue = Math.max(...annualCostNew) > 40
    ? 50
    : Math.max(...annualCostNew) > 30
    ? 40
    : Math.max(...annualCostNew) > 20
    ? 30
    : Math.max(...annualCostNew) > 10
    ? 20
    : Math.max(...annualCostNew) > 5
    ? 10
    : Math.max(...annualCostNew) > 1
    ? 5
    : 1;

    this.chartOptionstco = {
      series: [
        {
          name: "Total Annual Cost($)",
          data: annualChartData,
          type: "bar",
          color: '#FF8531',
        },
        {
          name: "Cost Per Mile ($)",
          data: annualCostNew,
          type: "bar",
          color:'#FFBD8F',
        }
      ],
      chart: {
        type: "bar",
        height: 290,
        zoom: {
          enabled: false
        },
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '40%',
          distributed: false,
          startingShape: 'rounded',
          endingShape: 'rounded',
          barGroupPadding: '15%', // Add padding between the bar groups
        },
      },
      stroke: {
        colors: ["transparent"],
        width: 5
      },
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'left',
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: ["2025", "2026", "2027"],
        labels: {
          show: true,
          style: {
            colors: "#aeaeae",
            fontSize: '18px',
            fontWeight: 400,
            cssClass: "chart-label-x"
          },
        },
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: [
        {
          title: {
            offsetX: 0,
            offsetY: 75,
            text: "Annual Cost"
          },
          tickAmount: 5,
          labels: {
            show: true,
            style: {
              colors: "#aeaeae",
              fontSize: '12px',
              fontWeight: 400,
              cssClass: 'fixed-width-label'
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
            }
          },
          axisBorder: {
            show: true,
            color: "#F0F0F0", // Color of the y-axis border
            width: 1 // Width of the y-axis border
        },
        },
        {
          opposite: true,
          title: {
            offsetX: 0,
            offsetY: 65,
            text: "Cost Per Mile"
          },
          min:0,
          max:maxValue,
          tickAmount: 5,
          labels: {
            formatter: function (val) {
              return (val).toFixed(2);
            }
          },
          axisBorder: {
            show: true,
            color: "#F0F0F0", // Color of the y-axis border
            width: 1 // Width of the y-axis border
        },
        }
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          // Get the value of the hovered bar
          const value = series[seriesIndex][dataPointIndex];
          const backgroundColor = seriesIndex === 0 ? '#FF8531' : '#FFBD8F';
          const seriesName = seriesIndex === 0 ? 'Annual Cost' : 'Cost Per Mile';

          // Hide x-axis labels in the tooltip by not including them in the custom tooltip
          return `
            <div style="position: relative; background-color:${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px;">
              <span style="font-weight:500; font-family:'Poppins'">${seriesName} : </span>${value}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        },
        x: {
          show: false // This hides the x-axis values in the tooltip
        }
      },
      grid: {
        show: false,
        borderColor: "#ffffff"
      },
      annotations: {
        xaxis: [
          {
            x: '2024',
            borderColor: '#000000',
            label: {
              style: {
                color: '#000000',
              },
              position: 'top',
            }
          },
          {
            x: '2025',
            borderColor: '#000000',
            label: {
              style: {
                color: '#000000',
              },
              position: 'top',
            }
          }
        ]
      }
    };
  }
  chartFuelCostProjection(fuelcost: number[], annualcost: number[]) {
    this.tcoChartData.fuelData = this.costData?.fuelCostInDollarPerYear ? Object.values(this.costData?.fuelCostInDollarPerYear)
    .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    // Combine the data into an array of objects for easy sorting
    let fuelcostNew = this.costData?.fuelCostInDollarPerYear
    ? Object.values(this.costData.fuelCostInDollarPerYear)
        .slice(0, 3)
        .map((item: any) => {
          let value = Number(item) /  (this.costData?.totalDistanceOfCurrentYear)
          let roundedValue = parseFloat(value.toFixed(2));
          return roundedValue === 0 ? 0.01 : roundedValue; // Ensure non-zero minimum
        })
    : [];
    const maxTripCount = Math.max(...this.tcoChartData.fuelData);
    const maxAnnualCostNew = Math.max(...fuelcostNew);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    const maxValue = Math.max(...fuelcostNew) > 40
    ? 50
    : Math.max(...fuelcostNew) > 30
    ? 40
    : Math.max(...fuelcostNew) > 20
    ? 30
    : Math.max(...fuelcostNew) > 10
    ? 20
    : Math.max(...fuelcostNew) > 5
    ? 10
    : Math.max(...fuelcostNew) > 1
    ? 5
    : 1;
    this.chartOptionsFuelCost = {
        series: [
            {
                name: "Annual Fuel Cost ($)",
                data: this.tcoChartData.fuelData,
                type: "bar",
          color: '#8BB0FF',
            },
            {
                name: "Cost Per Mile ($)",
                data: fuelcostNew,
                type: "bar",
                color:'#AFC9FF',
            },
        ],
        chart: {
          type: "bar",
          height: 290,
          width:340,
          zoom: {
            enabled: false
          },
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            borderRadius: 5,
            columnWidth: '40%',
            distributed: false,
            startingShape: 'rounded',
            endingShape: 'rounded',
            barGroupPadding: '15%', // Add padding between the bar groups
          },
        },
        stroke: {
          colors: ["transparent"],
          width: 3
        },
        dataLabels: {
          enabled: false
        },
        legend: {
          show: false,
          position: 'bottom',
          horizontalAlign: 'left',
        },
        markers: {
          size: 0,
          hover: {
            sizeOffset: 6
          }
        },
        xaxis: {
          categories: ["2025", "2026", "2027"],
          labels: {
            show: true,
            style: {
              colors: "#aeaeae",
              fontSize: '18px',
              fontWeight: 400,
              cssClass: "chart-label-x"
            },
            offsetX: -1, // Adjust the horizontal offset
            offsetY: 0, // Adjust the vertical offset
          },
          lines: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: [
          {
            title: {
              offsetX: 0,
              offsetY: 75,
              text: "Annual Cost"
            },
            min:0,
            max:yAxisMax,
            tickAmount: 5,
            labels: {
              show: true,
              style: {
                colors: "#aeaeae",
                fontSize: '12px',
                fontWeight: 400,
                  cssClass: 'fixed-width-label'
              },
              formatter: function (value) {
                return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
              }
            },
            axisBorder: {
              show: true,
              color: "#F0F0F0", // Color of the y-axis border
              width: 1 // Width of the y-axis border
          },
          },
          {
            opposite: true,
            title: {
              offsetX: 0,
              offsetY: 65,
              text: "Cost Per Mile"
            },
            min:0,
            max:maxValue,
            tickAmount: 5,
            labels: {
              formatter: function (val) {
                return (val).toFixed(2);
              }
            },
            axisBorder: {
              show: true,
              color: "#F0F0F0", // Color of the y-axis border
              width: 1 // Width of the y-axis border
          },
          }
        ],
        tooltip: {
          custom: function ({ series, seriesIndex, dataPointIndex }) {
            // Get the value of the hovered bar
            const value = series[seriesIndex][dataPointIndex];
            const backgroundColor = seriesIndex === 0 ? '#8BB0FF' : '#AFC9FF';
            const seriesName = seriesIndex === 0 ? 'Fuel Cost' : 'Cost Per Mile';
            return `
              <div style="position: relative; background-color:${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px;">
                <span style="font-weight:500; font-family:'Poppins'">${seriesName} : </span>${value}
                <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
              </div>
            `;
          }
        },
        grid: {
          show: false,
          borderColor: "#E5E5E5", // Set the color of the grid lines
          xaxis: {
            lines: {
              show: false // Show vertical grid lines
            }
          },
          yaxis: {
            lines: {
              show: false, // Hide horizontal grid lines
              color:'#000000'
            }
          }
        },
        annotations: {
          xaxis: [
            {
              x: '2024',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            },
            {
              x: '2025',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            }
          ]
        }
    };

 }
  chartDepriciation(depreciationCost, annualCost) {
    this.tcoChartData.depreciationData = this.costData?.yearlyDepreciationCostInDollarPerYear ? Object.values(this.costData?.yearlyDepreciationCostInDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    let depreciationData = this.costData?.yearlyDepreciationCostInDollarPerYear ? Object.values(this.costData?.yearlyDepreciationCostInDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number((Number(item)).toFixed(2)) }) : []
      let annualCostNew = this.costData?.yearlyDepreciationCostInDollarPerYear
      ? Object.values(this.costData.yearlyDepreciationCostInDollarPerYear)
          .slice(0, 3)
          .map((item: any) => {
            let value = Number(item) /  (this.costData?.totalDistanceOfCurrentYear)
            let roundedValue = parseFloat(value.toFixed(2));
            return roundedValue === 0 ? 0.01 : roundedValue; // Ensure non-zero minimum
          })
      : [];
// Find max values
// const maxAnnualData = Math.max(...annualData);
const maxAnnualCostNew = Math.max(...annualCostNew);
const maxAnnualData = Math.max(...depreciationData);
const yAxisMax = maxAnnualData > 5 ? Math.ceil(maxAnnualData / 10) * 10 : 10;
const maxValue = Math.max(...annualCostNew) > 40
    ? 50
    : Math.max(...annualCostNew) > 30
    ? 40
    : Math.max(...annualCostNew) > 20
    ? 30
    : Math.max(...annualCostNew) > 10
    ? 20
    : Math.max(...annualCostNew) > 5
    ? 10
    : Math.max(...annualCostNew) > 1
    ? 5
    : 1;
    this.chartOptionsDepriciation = {
      series: [
        {
          name: "Annual Depreciation Cost ($)",
          data: depreciationData,
          type: "bar",
          color: '#95D3BF',
        },
        {
          name: "Cost Per Mile ($)",
          data: annualCostNew,
          type: "bar",
          color:'#A1E7D0',
        },
      ],
      chart: {
        type: "bar",
        height: 290,
        width:340,
        zoom: {
          enabled: false
        },
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: '40%',
          distributed: false,
          startingShape: 'rounded',
          endingShape: 'rounded',
          barGroupPadding: '15%', // Add padding between the bar groups
        },
      },
      stroke: {
        colors: ["transparent"],
        width: 3
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'left',
      },
      marker: {
        show: false, // Hide the marker in the tooltip
      },
      xaxis: {
        categories: ["2025", "2026", "2027"],
        labels: {
          show: true,
          style: {
            colors: "#aeaeae",
            fontSize: '18px',
            fontWeight: 400,
            cssClass: "chart-label-x"
          },
          offsetX: -1, // Adjust the horizontal offset
          offsetY: 0, // Adjust the vertical offset
        },
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: [
        {
          title: {
            offsetX: 0,
            offsetY: 75,
            text: "Annual Cost"
          },
          // min:0,
          // max:[yAxisMax],
          tickAmount: 5,
          labels: {
            show: true,
            style: {
              colors: "#aeaeae",
              fontSize: '12px',
              fontWeight: 400,
               cssClass: 'fixed-width-label'
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
            }
          },
          axisBorder: {
            show: true,
            color: "#F0F0F0", // Color of the y-axis border
            width: 1 // Width of the y-axis border
        },
        },
        {
          opposite: true,
          title: {
            offsetX: 0,
            offsetY: 65,
            text: "Cost Per Mile"
          },
          min:0,
          max:maxValue,
          tickAmount: 5,
          labels: {
            formatter: function (val) {
              return (val).toFixed(2);
            }
          },
          axisBorder: {
            show: true,
            color: "#F0F0F0", // Color of the y-axis border
            width: 1 // Width of the y-axis border
        },
        }
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex }) {
          // Get the value of the hovered bar
          const value = series[seriesIndex][dataPointIndex];
          const seriesName = seriesIndex === 0 ? 'Depreciation Cost' : 'Cost Per Mile';
          const backgroundColor = seriesIndex === 0 ? '#95D3BF' : '#A1E7D0';
          return `
             <div style="position: relative; background-color: ${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px;">
  <span style="font-weight: 500; font-family: 'Poppins'">${seriesName} : </span>${value}
</div>
            `;
        }
      },
      grid: {
        show: false,
        borderColor: "#ffffff"
      },
      annotations: {
        xaxis: [
          {
            x: '2024',
            borderColor: '#000000',
            label: {
              style: {
                color: '#000000',
              },
              position: 'top',
            }
          },
          {
            x: '2025',
            borderColor: '#000000',
            label: {
              style: {
                color: '#000000',
              },
              position: 'top',
            }
          }
        ]
      }
    };
  }
  chartMaintenance(annualCost) {
    this.tcoChartData.maintenanceData = this.costData?.maintenanceCostInDollarPerYear ? Object.values(this.costData?.maintenanceCostInDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    this.tcoChartData.maintenanceMileData = annualCost
    let maintenanceData = this.costData?.maintenanceCostInDollarPerYear ? Object.values(this.costData?.maintenanceCostInDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(Number(item).toFixed(2)) }) : []
      let annualCostNew = this.costData?.maintenanceCostInDollarPerYear
      ? Object.values(this.costData.maintenanceCostInDollarPerYear)
          .slice(0, 3)
          .map((item: any) => {
            let value = Number(item) /  (this.costData?.totalDistanceOfCurrentYear)
            let roundedValue = parseFloat(value.toFixed(2));
            return roundedValue === 0 ? 0.01 : roundedValue; // Ensure non-zero minimum
          })
      : [];
      const maxAnnualCostNew = Math.max(...annualCostNew);
      const maxAnnualData = Math.max(...maintenanceData);
      const yAxisMax = maxAnnualData > 5 ? Math.ceil(maxAnnualData / 10) * 10 : 10;
      const maxValue = Math.max(...annualCostNew) > 40
      ? 50
      : Math.max(...annualCostNew) > 30
      ? 40
      : Math.max(...annualCostNew) > 20
      ? 30
      : Math.max(...annualCostNew) > 10
      ? 20
      : Math.max(...annualCostNew) > 5
      ? 10
      : Math.max(...annualCostNew) > 1
      ? 5
      : 1;
    this.chartOptionsMaintenance = {
      series: [
        {
          name: "Annual Maintenance Cost ($)",
          data: maintenanceData,
          type: "bar",
          color: '#EB5252',
        },
        {
          name: "Cost Per Mile ($)",
          data: annualCostNew,
          type: "bar",
          color:'#FFB0B0',
        },


      ],
      chart: {
        type: "bar",
        height: 290,
        width:340,
        zoom: {
          enabled: false
        },
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: '40%',
          distributed: false,
          startingShape: 'rounded',
          endingShape: 'rounded',
          barGroupPadding: '15%', // Add padding between the bar groups
        },
      },
      stroke: {
        colors: ["transparent"],
        width: 3
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false,
        position: 'bottom',
        horizontalAlign: 'left',
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        categories: ["2025", "2026", "2027"],
        labels: {
          show: true,
          style: {
            colors: "#aeaeae",
            fontSize: '18px',
            fontWeight: 400,
            cssClass: "chart-label-x"
          },
          offsetX: -1, // Adjust the horizontal offset
          offsetY: 0, // Adjust the vertical offset
        },
        lines: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: [
        {
          title: {
            offsetX: 0,
            offsetY: 75,
            text: "Annual Cost"
          },
          min:0,
          max:yAxisMax,
          tickAmount: 4,
          labels: {
            show: true,
            style: {
              colors: "#aeaeae",
              fontSize: '12px',
              fontWeight: 400,
            cssClass: 'fixed-width-label'
            },
            formatter: function (value) {
              return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
            }
          },
          axisBorder: {
            show: true,
            color: "#F0F0F0", // Color of the y-axis border
            width: 1 // Width of the y-axis border
        },
        },
        {
          opposite: true,
          title: {
            offsetX: 0,
            offsetY: 65,
            text: "Cost Per Mile"
          },
          min:0,
          max:maxValue,
          tickAmount: 5,
          labels: {
            formatter: function (val) {
              return (val).toFixed(2);
            }
          },
          axisBorder: {
            show: true,
            color: "#F0F0F0", // Color of the y-axis border
            width: 1 // Width of the y-axis border
        },
        }
      ],
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex }) {
          // Get the value of the hovered bar
          const value = series[seriesIndex][dataPointIndex];
          const seriesName = seriesIndex === 0 ? 'Maintenance Cost' : 'Cost Per Mile';

          // Determine the background color based on the series index
          const backgroundColor = seriesIndex === 0 ? '#EB5252' : '#FFB0B0';

          return `
            <div style="position: relative; background-color: ${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px;">
              <span style="font-weight:500; font-family:'Poppins'">${seriesName} : </span>${value}
              <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
            </div>
          `;
        }
      },
      grid: {
        show: false,
        borderColor: "#ffffff"
      },
      annotations: {
        xaxis: [
          {
            x: '2024',
            borderColor: '#000000',
            label: {
              style: {
                color: '#000000',
              },
              position: 'top',
            }
          },
          {
            x: '2025',
            borderColor: '#000000',
            label: {
              style: {
                color: '#000000',
              },
              position: 'top',
            }
          }
        ]
      }
    };
  }
  chartInsurance(annualCost) {
    this.tcoChartData.insuranceData = this.costData?.insuranceFeeInCostDollarPerYear ? Object.values(this.costData?.insuranceFeeInCostDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    this.tcoChartData.maintenanceMileData = annualCost
    let insuranceData = this.costData?.insuranceFeeInCostDollarPerYear ? Object.values(this.costData?.insuranceFeeInCostDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(((Number(item) / this.noofVehicles) / 100).toFixed(2)) }) : []
    let annualCostNew = annualCost.map((item: any) => {
      return this.hide ? Number(item) : Number((item / this.noofVehicles).toFixed(2))
    })

  }
  chartStateTax(annualCost) {
    this.tcoChartData.stateData = this.costData?.stateFeeInCostDollarPerYear ? Object.values(this.costData?.stateFeeInCostDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    this.tcoChartData.maintenanceMileData = annualCost
    let stateData = this.costData?.stateFeeInCostDollarPerYear ? Object.values(this.costData?.stateFeeInCostDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(((Number(item) / this.noofVehicles) / 100).toFixed(2)) }) : []
    let annualCostNew = annualCost.map((item: any) => {
      return this.hide ? Number(item) : Number((item / this.noofVehicles).toFixed(2))
    })

  }

  getVin() {
    this.sub = this.route.queryParamMap.subscribe((params: any) => {
      this.fleetId = params.params['fleetId'] || -1;
      if (this.fleetId == 0) {
        this.router.navigate(['adlp/developer-corner/tcosearch'])
      } else {
        this.fleetIdData = this.fleetId
        this.getAllData()
      }
    });
  }
  async getAllData() {
    this.spinner.show()
    let obj: any = {}
    obj.fleetId = this.fleetId
    if (this.makeIdData) {
      obj.provider = this.makeIdData
    }
    if (this.modelIdData) {
      obj.model = this.modelIdData
    }
    if (this.yearIdData) {
      obj.modelYear = this.yearIdData
    }

    if (this.companyIdData) {
      obj.makeList = this.companyIdData
    }
    if (this.fuelIdData) {
      obj.primaryFuelType = this.fuelIdData
    }

    if (this.stateIdData) {
      obj.state = this.stateIdData
    }
    let isChartUpdateRequired = this.fleetId != null; // Example condition, adjust as needed

    this.subscription$.add(
      this.userService.getFleetDetailTCO(obj).subscribe((res: any) => {
        this.VINsummary = res
        // this.totalDistanceTravelled = res?.totalDistanceOfCurrentYear * 0.62137119
        this.totalDistanceTravelled = res?.totalDistanceOfCurrentYear
        this.noofVehicles = res.numberOfVehicles
        if (this.VINsummary?.fuelCostInDollarPerGallon < 0) {
          if (this.makeIdData == "" && this.modelIdData == "" && this.yearIdData == "" && this.companyIdData == '' && this.fuelIdData == '' && this.stateIdData == '') {
            this.openModelFleet()
          }
          else {
            if (this.makeIdData == null && this.modelIdData == null && this.yearIdData == null && this.companyIdData == null && this.fuelIdData == null && this.stateIdData == '' ) {
              this.openModelFleet()
            }
            else {
              this.openModel()
            }
          }
        }
        // this.getVINdata(this.VINsummary)
        this.getFuelCost(this.VINsummary);
        this.spinner.hide()
        this.internalServer = false;
        this.internalServer1 = true;

      }, (err => {
        this.spinner.hide()
        if (err.status === 500) {
          // this.appService.openSnackBar('Internal Server Error', 'Error');
          this.internalServer = true;
          this.internalServer1 = false;

        }
      }))
    )
    this.getFleetSummaryData()

  }

  goBack(){
    this.router.navigate(['/adlp/dashboards/tcosearch']);
  }

  async getFuelCost(data: any,) {
    this.costData = data
    let chartDetail = this.tcoChartData
    let mileagePerYear: any = Object.values(data?.mileagePerYearInMiles).slice(0, 3)
    let totalmileageCost: any = Object.values(data?.mileagePerYearInMiles).slice(0, 3).map((item: any, index) => { return Number((item / mileagePerYear[index]).toFixed(2)) })

    let mileData = Object.values(data?.fuelCostInDollarPerYear).map((item: any) => { return Number(item.toFixed(2)) })
    let depreciationCostNew = Object.values(data?.yearlyDepreciationCostInDollarPerYear).map((item: any) => { return Number(item.toFixed(2)) })
    // let fuelCostperYear: any = Object.values(data?.fuelCostInDollarPerYear).slice(0, 3)
     this.tcoChartData.insuranceData = [this.costData?.annualInsurance, this.costData?.annualInsurance, this.costData?.annualInsurance]
    let totalMaintanaceCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.maintenanceCostInDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })
    let annualCotNew = Object.values(data?.totalCostAnnualProjection).map((item: any) => { return Number(item.toFixed(2)) })
    let totalfuelCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.fuelCostInDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })

    let totalInsuranceCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.insuranceFeeInCostDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })
    let totalStateCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.stateFeeInCostDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })
    let annualData = this.tcoChartData.fuelData.map(function (item, i) {
      return Number((item + chartDetail.depreciationData[i] + chartDetail.maintenanceData[i] + chartDetail.insuranceData[i] + chartDetail.stateData[i]).toFixed(2));
    })
    let perMileCost = this.tcoChartData.fuelMileData.map(function (item, i) {
      return Number((item + chartDetail.depreciationMileData[i] + chartDetail.maintenanceMileData[i] + chartDetail.insuranceMileData[i] + chartDetail.stateMileData[i]).toFixed(2));
    })

    this.tcoChartData.stateData = [this.costData?.stateFee, this.costData?.stateFee, this.costData?.stateFee]
    // let totalStateCost: any = mileagePerYear.map((item: any, index) => { return Number((this.costData?.stateFee / item).toFixed(2)) })
    // this.tcoChartData.stateMileData = totalStateCost
    await this.chartFuelCostProjections(mileData, totalfuelCost)
    await this.chartAnnualProjections(perMileCost, annualCotNew)
    await this.chartDepriciations(depreciationCostNew, totalmileageCost)
    await this.chartMaintenances(totalMaintanaceCost)
    await this.chartInsurances(totalInsuranceCost)
    await this.chartStateTaxs(totalStateCost)
    await this.chartTcoForVINs();

  }


    // Chart for New TCO FLEET //
    chartAnnualProjections(mileData, categoriesData) {
      // Divide annualData by 100
      let annualChartData = this.costData?.totalAvgAnnualProjection
        ? Object.values(this.costData?.totalAvgAnnualProjection).slice(0, 3)
          .map((item: any) => Number((Number(item)).toFixed(2)))
        : [];
    let annualCostNew = this.costData?.totalAvgAnnualProjection
    ? Object.values(this.costData.totalAvgAnnualProjection)
        .slice(0, 3)
        .map((item: any) => {
          let value = Number(item) /  (this.costData?.totalDistanceOfCurrentYear / this.noofVehicles)
          let roundedValue = parseFloat(value.toFixed(2));
          return roundedValue === 0 ? 0.01 : roundedValue; // Ensure non-zero minimum
        })
    : [];
    const maxAnnualCostNew = Math.max(...annualCostNew);
    const maxAnnualData = Math.max(...annualChartData);
    const yAxisMaxOpp = maxAnnualCostNew > 5 ? Math.ceil(maxAnnualCostNew): 0.5;
    const maxValue = Math.max(...annualCostNew) > 40
    ? 50
    : Math.max(...annualCostNew) > 30
    ? 40
    : Math.max(...annualCostNew) > 20
    ? 30
    : Math.max(...annualCostNew) > 10
    ? 20
    : Math.max(...annualCostNew) > 5
    ? 10
    : Math.max(...annualCostNew) > 1
    ? 5
    : 1;
      this.chartOptionstco = {
        series: [
          {
            name: "Total Annual Cost($)",
            data: annualChartData,
            type: "bar",
            color: '#FF8531',
          },
          {
            name: "Cost Per Mile ($)",
            data: annualCostNew,
            type: "bar",
            color:'#FFBD8F',
          }
        ],
        chart: {
          type: "bar",
          height: 290,
          zoom: {
            enabled: false
          },
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            borderRadius: 6,
            columnWidth: '40%',
            distributed: false,
            startingShape: 'rounded',
            endingShape: 'rounded',
            barGroupPadding: '15%', // Add padding between the bar groups
          },
        },
        stroke: {
          colors: ["transparent"],
          width: 5
        },
        legend: {
          show: false,
          position: 'bottom',
          horizontalAlign: 'left',
        },
        markers: {
          size: 0,
          hover: {
            sizeOffset: 6
          }
        },
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories: ["2025", "2026", "2027"],
          labels: {
            show: true,
            style: {
              colors: "#aeaeae",
              fontSize: '18px',
              fontWeight: 400,
              cssClass: "chart-label-x"
            },
          },
          lines: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: [
          {
            title: {
              offsetX: 0,
              offsetY: 75,
              text: "Average Cost"
            },
            min:0,
            tickAmount: 5,
            labels: {
              show: true,
              style: {
                colors: "#aeaeae",
                fontSize: '18px',
                fontWeight: 400,
                cssClass: "chart-label-x"
              },
              formatter: function (value) {
                return value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value;
              }
            },
            axisBorder: {
              show: true,
              color: "#F0F0F0", // Color of the y-axis border
              width: 1 // Width of the y-axis border
          },
          },
          {
            opposite: true,
            title: {
              offsetX: 0,
              offsetY: 73,
              text: "Cost Per Mile"
            },
            min:0,
            max:maxValue,
            tickAmount: 5,
            labels: {
              formatter: function (val) {
                return (val).toFixed(2);
              }
            },
            axisBorder: {
              show: true,
              color: "#F0F0F0", // Color of the y-axis border
              width: 1 // Width of the y-axis border
          },
          }
        ],
        tooltip: {
          custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            // Get the value of the hovered bar
            const value = series[seriesIndex][dataPointIndex];
            const backgroundColor = seriesIndex === 0 ? '#FF8531' : '#FFBD8F';
            const seriesName = seriesIndex === 0 ? 'Average Annual Cost' : 'Cost Per Mile';

            // Hide x-axis labels in the tooltip by not including them in the custom tooltip
            return `
              <div style="position: relative; background-color:${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border:none!important; border-radius: 5px;">
                <span style="font-weight:500; font-family:'Poppins'">${seriesName} : </span>${value}
                <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
              </div>
            `;
          },
          x: {
            show: false // This hides the x-axis values in the tooltip
          }
        },
        grid: {
          show: false,
          borderColor: "#ffffff"
        },
        annotations: {
          xaxis: [
            {
              x: '2024',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            },
            {
              x: '2025',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            }
          ]
        }
      };
    }
    chartFuelCostProjections(fuelcost: number[], annualcost: number[]) {
      this.tcoChartData.fuelData = this.costData?.fuelCostInDollarPerYearAvg ? Object.values(this.costData?.fuelCostInDollarPerYearAvg)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
         let fuelcostNew = this.costData?.fuelCostInDollarPerYearAvg
      ? Object.values(this.costData?.fuelCostInDollarPerYearAvg)
        .slice(0, 3)
        .map((item: any) => Number(((Number(item) /  (this.costData?.totalDistanceOfCurrentYear  / this.noofVehicles))).toFixed(2)))
      : [];
      const maxTripCount = Math.max(... this.tcoChartData.fuelData);
      const maxTripCounts = Math.max(... fuelcostNew);
      const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
      const maxValue = Math.max(...fuelcostNew) > 40
      ? 50
      : Math.max(...fuelcostNew) > 30
      ? 40
      : Math.max(...fuelcostNew) > 20
      ? 30
      : Math.max(...fuelcostNew) > 10
      ? 20
      : Math.max(...fuelcostNew) > 5
      ? 10
      : Math.max(...fuelcostNew) > 1
      ? 5
      : 1;
      this.chartOptionsFuelCost = {
          series: [
              {
                  name: "Annual Fuel Cost ($)",
                  data:  this.tcoChartData.fuelData ,
                  type: "bar",
                  color: '#8BB0FF',
              },
              {
                  name: "Cost Per Mile ($)",
                  data: fuelcostNew,
                  type: "bar",
                  color:'#D8E4FF',
              },
          ],
          chart: {
            type: "bar",
            height: 290,
            width:340,
            zoom: {
              enabled: false
            },
            toolbar: { show: false },
          },
          plotOptions: {
            bar: {
              borderRadius: 5,
              columnWidth: '40%',
              distributed: false,
              startingShape: 'rounded',
              endingShape: 'rounded',
              barGroupPadding: '15%', // Add padding between the bar groups
            },
          },
          stroke: {
            colors: ["transparent"],
            width: 3
          },
          dataLabels: {
            enabled: false
          },
          legend: {
            show: false,
            position: 'bottom',
            horizontalAlign: 'left',
          },
          markers: {
            size: 0,
            hover: {
              sizeOffset: 6
            }
          },
          xaxis: {
            categories: ["2025", "2026", "2027"],
            labels: {
              show: true,
              style: {
                colors: "#aeaeae",
                fontSize: '18px',
                fontWeight: 400,
                cssClass: "chart-label-x"
              },
              offsetX: -1, // Adjust the horizontal offset
              offsetY: 0, // Adjust the vertical offset
            },
            lines: {
              show: false,
            },
            axisBorder: {
              show: false,
            },
            axisTicks: {
              show: false,
            },
          },
          yaxis: [
            {
              title: {
                offsetX: 0,
                offsetY: 75,
                text: "Average Cost"
              },
              min:0,
              max:yAxisMax,
              tickAmount: 5,
              labels: {
                show: true,
                style: {
                  colors: "#aeaeae",
                  fontSize: '18px',
                  fontWeight: 400,
                  cssClass: "chart-label-x"
                },
                formatter: function (value) {
                  return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
                }
              },
              axisBorder: {
                show: true,
                color: "#F0F0F0", // Color of the y-axis border
                width: 1 // Width of the y-axis border
            },
            },
            {
              opposite: true,
              title: {
                offsetX: 0,
                offsetY: 73,
                text: "Cost Per Mile"
              },
              min:0,
              max:maxValue,
              tickAmount: 5,
              labels: {
                formatter: function (val) {
                  return (val).toFixed(2);
                }
              },
              axisBorder: {
                show: true,
                color: "#F0F0F0", // Color of the y-axis border
                width: 1 // Width of the y-axis border
            },
            }
          ],
          tooltip: {
            custom: function ({ series, seriesIndex, dataPointIndex }) {
              // Get the value of the hovered bar
              const value = series[seriesIndex][dataPointIndex];
              const backgroundColor = seriesIndex === 0 ? '#8BB0FF' : '#D8E4FF';
              const seriesName = seriesIndex === 0 ? 'Fuel Cost' : 'Cost Per Mile';
              return `
                <div style="position: relative; background-color:${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px;">
                  <span style="font-weight:500; font-family:'Poppins'">${seriesName} : </span>${value}
                  <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
                </div>
              `;
            }
          },
          grid: {
            show: false,
            borderColor: "#E5E5E5", // Set the color of the grid lines
            xaxis: {
              lines: {
                show: false // Show vertical grid lines
              }
            },
            yaxis: {
              lines: {
                show: false, // Hide horizontal grid lines
                color:'#000000'
              }
            }
          },

      };

  }
    chartDepriciations(depreciationCost, annualCost) {
      this.tcoChartData.depreciationData = this.costData?.yearlyDepreciationCostInDollarPerYearAvg ? Object.values(this.costData?.yearlyDepreciationCostInDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
      let depreciationData = this.costData?.yearlyDepreciationCostInDollarPerYearAvg ? Object.values(this.costData?.yearlyDepreciationCostInDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number((Number(item)).toFixed(2)) }) : []
      let annualCostNew = this.costData?.yearlyDepreciationCostInDollarPerYearAvg
        ? Object.values(this.costData?.yearlyDepreciationCostInDollarPerYearAvg)
          .slice(0, 3)
          .map((item: any) => Number(((Number(item) /  (this.costData?.totalDistanceOfCurrentYear  / this.noofVehicles))).toFixed(2)))
        : [];
  const maxAnnualData = Math.max(...depreciationData);
  const yAxisMax = maxAnnualData > 5 ? Math.ceil(maxAnnualData / 10) * 10 : 10;
  const maxValue = Math.max(...annualCostNew) > 40
    ? 50
    : Math.max(...annualCostNew) > 30
    ? 40
    : Math.max(...annualCostNew) > 20
    ? 30
    : Math.max(...annualCostNew) > 10
    ? 20
    : Math.max(...annualCostNew) > 5
    ? 10
    : Math.max(...annualCostNew) > 1
    ? 5
    : 1;
      this.chartOptionsDepriciation = {
        series: [
          {
            name: "Annual Depreciation Cost ($)",
            data: depreciationData,
            type: "bar",
            color: '#95D3BF',
          },
          {
            name: "Cost Per Mile ($)",
            data: annualCostNew,
            type: "bar",
            color:'#C4F2E3',
          },
        ],
        chart: {
          type: "bar",
          height: 290,
          width:340,
          zoom: {
            enabled: false
          },
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            borderRadius: 5,
            columnWidth: '40%',
            distributed: false,
            startingShape: 'rounded',
            endingShape: 'rounded',
            barGroupPadding: '15%', // Add padding between the bar groups
          },
        },
        stroke: {
          colors: ["transparent"],
          width: 3
        },
        dataLabels: {
          enabled: false
        },
        legend: {
          show: false,
          position: 'bottom',
          horizontalAlign: 'left',
        },
        markers: {
          size: 0,
          hover: {
            sizeOffset: 6
          }
        },
        xaxis: {
          categories: ["2025", "2026", "2027"],
          labels: {
            show: true,
            style: {
              colors: "#aeaeae",
              fontSize: '18px',
              fontWeight: 400,
              cssClass: "chart-label-x"
            },
            offsetX: -1, // Adjust the horizontal offset
            offsetY: 0, // Adjust the vertical offset
          },
          lines: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: [
          {
            title: {
              offsetX: 0,
              offsetY: 75,
              text: "Average Cost"
            },
            min:0,
            max:yAxisMax,
            tickAmount: 4,
            labels: {
              show: true,
              style: {
                colors: "#aeaeae",
                fontSize: '18px',
                fontWeight: 400,
                cssClass: "chart-label-x"
              },
              formatter: function (value) {
                return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
              }
            },
            axisBorder: {
              show: true,
              color: "#F0F0F0", // Color of the y-axis border
              width: 1 // Width of the y-axis border
          },
          },
          {
            opposite: true,
            title: {
              offsetX: 0,
              offsetY: 73,
              text: "Cost Per Mile"
            },
            min:0,
            max:maxValue,
            tickAmount: 5,
            labels: {
              formatter: function (val) {
                return (val).toFixed(2);
              }
            },
            axisBorder: {
              show: true,
              color: "#F0F0F0", // Color of the y-axis border
              width: 1 // Width of the y-axis border
          },
          }
        ],
        tooltip: {
          custom: function ({ series, seriesIndex, dataPointIndex }) {
            // Get the value of the hovered bar
            const value = series[seriesIndex][dataPointIndex];
            const seriesName = seriesIndex === 0 ? 'Depreciation Cost' : 'Cost Per Mile';
            const backgroundColor = seriesIndex === 0 ? '#95D3BF' : '#C4F2E3';
            return `
               <div style="position: relative; background-color: ${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px;">
    <span style="font-weight: 500; font-family: 'Poppins'">${seriesName} : </span>${value}
  </div>
              `;
          }
        },
        grid: {
          show: false,
          borderColor: "#ffffff"
        },
        annotations: {
          xaxis: [
            {
              x: '2024',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            },
            {
              x: '2025',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            }
          ]
        }
      };
    }
    chartMaintenances(annualCost) {
      this.tcoChartData.maintenanceData = this.costData?.maintenanceCostInDollarPerYearAvg ? Object.values(this.costData?.maintenanceCostInDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
      this.tcoChartData.maintenanceMileData = annualCost
      let maintenanceData = this.costData?.maintenanceCostInDollarPerYearAvg ? Object.values(this.costData?.maintenanceCostInDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(Number(item).toFixed(2)) }) : []

        let annualCostNew = this.costData?.maintenanceCostInDollarPerYearAvg ? Object.values(this.costData?.maintenanceCostInDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(((Number(item) /  (this.costData?.totalDistanceOfCurrentYear / this.noofVehicles))).toFixed(2)) }) : []

        const maxAnnualData = Math.max(...maintenanceData);
        const yAxisMax = maxAnnualData > 5 ? Math.ceil(maxAnnualData / 10) * 10 : 10;

        const maxAnnualDataOpp = Math.max(...annualCostNew);
        const maxValue = Math.max(...annualCostNew) > 40
    ? 50
    : Math.max(...annualCostNew) > 30
    ? 40
    : Math.max(...annualCostNew) > 20
    ? 30
    : Math.max(...annualCostNew) > 10
    ? 20
    : Math.max(...annualCostNew) > 5
    ? 10
    : Math.max(...annualCostNew) > 1
    ? 5
    : 1;
      this.chartOptionsMaintenance = {
        series: [
          {
            name: "Annual Maintenance Cost ($)",
            data: maintenanceData,
            type: "bar",
            color: '#EB5252',
          },
          {
            name: "Cost Per Mile ($)",
            data: annualCostNew,
            type: "bar",
            color:'#FFB0B0',
          },


        ],
        chart: {
          type: "bar",
          height: 290,
          width:340,
          zoom: {
            enabled: false
          },
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            borderRadius: 5,
            columnWidth: '40%',
            distributed: false,
            startingShape: 'rounded',
            endingShape: 'rounded',
            barGroupPadding: '15%', // Add padding between the bar groups
          },
        },
        stroke: {
          colors: ["transparent"],
          width: 3
        },
        dataLabels: {
          enabled: false
        },
        legend: {
          show: false,
          position: 'bottom',
          horizontalAlign: 'left',
        },
        markers: {
          size: 0,
          hover: {
            sizeOffset: 6
          }
        },
        xaxis: {
          categories: ["2025", "2026", "2027"],
          labels: {
            show: true,
            style: {
              colors: "#aeaeae",
              fontSize: '18px',
              fontWeight: 400,
              cssClass: "chart-label-x"
            },
            offsetX: -1, // Adjust the horizontal offset
            offsetY: 0, // Adjust the vertical offset
          },
          lines: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: [
          {
            title: {
              offsetX: 0,
              offsetY: 75,
              text: "Average Cost"
            },
            min:0,
            max:yAxisMax,
            tickAmount: 4,
            labels: {
              show: true,
              style: {
                colors: "#aeaeae",
                fontSize: '18px',
                fontWeight: 400,
                cssClass: "chart-label-x"
              },
              formatter: function (value) {
                return value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
              }
            },
            axisBorder: {
              show: false,
              color: "#F0F0F0", // Color of the y-axis border
              width: 1 // Width of the y-axis border
          },
          },
          {
            opposite: true,
            title: {
              offsetX: 0,
              offsetY: 73,
              text: "Cost Per Mile"
            },
            min:0,
            max:maxValue,
            tickAmount: 5,
            labels: {
              formatter: function (val) {
                return (val).toFixed(2);
              }
            },

          }
        ],
        tooltip: {
          custom: function ({ series, seriesIndex, dataPointIndex }) {
            // Get the value of the hovered bar
            const value = series[seriesIndex][dataPointIndex];
            const seriesName = seriesIndex === 0 ? 'Maintenance Cost' : 'Cost Per Mile';

            // Determine the background color based on the series index
            const backgroundColor = seriesIndex === 0 ? '#EB5252' : '#FFB0B0';

            return `
              <div style="position: relative; background-color: ${backgroundColor}; color: #523D2E; font-family: 'Poppins'; font-size: 10px; padding: 6px; border-radius: 5px;">
                <span style="font-weight:500; font-family:'Poppins'">${seriesName} : </span>${value}
                <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #FFBD8F;"></div>
              </div>
            `;
          }
        },
        grid: {
          show: false,
          borderColor: "#ffffff"
        },
        annotations: {
          xaxis: [
            {
              x: '2024',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            },
            {
              x: '2025',
              borderColor: '#000000',
              label: {
                style: {
                  color: '#000000',
                },
                position: 'top',
              }
            }
          ]
        }
      };
    }
    chartInsurances(annualCost) {
      this.tcoChartData.insuranceData = this.costData?.insuranceFeeInCostDollarPerYearAvg ? Object.values(this.costData?.insuranceFeeInCostDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
      this.tcoChartData.maintenanceMileData = annualCost
      let insuranceData = this.costData?.insuranceFeeInCostDollarPerYearAvg ? Object.values(this.costData?.insuranceFeeInCostDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(((Number(item) / this.noofVehicles) / 100).toFixed(2)) }) : []
      let annualCostNew = annualCost.map((item: any) => {
        return this.hide ? Number(item) : Number((item / this.noofVehicles).toFixed(2))
      })

    }
    chartStateTaxs(annualCost) {
      this.tcoChartData.stateData = this.costData?.stateFeeInCostDollarPerYearAvg ? Object.values(this.costData?.stateFeeInCostDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
      this.tcoChartData.maintenanceMileData = annualCost
      let stateData = this.costData?.stateFeeInCostDollarPerYearAvg ? Object.values(this.costData?.stateFeeInCostDollarPerYearAvg)
        .slice(0, 3).map((item: any) => { return Number(((Number(item) / this.noofVehicles) / 100).toFixed(2)) }) : []
      let annualCostNew = annualCost.map((item: any) => {
        return this.hide ? Number(item) : Number((item / this.noofVehicles).toFixed(2))
      })

    }


  getAllProvider() {
    this.subscription$.add(
      this.userService.getProviderListTCO(this.fleetId).subscribe((res: any) => {
        this.modelList = res.modelList
        this.yearList = res.modelYear
        this.provderList = res.providerList
        this.makeList = res.makeList
        this.fuelList = res.primaryFuelType
      }
      ))
  }


  getFleetSummaryData() {
    let obj: any = {}
    obj.fleetId = this.fleetId
    if (this.makeIdData) {
      obj.provider = this.makeIdData
    }
    if (this.modelIdData) {
      obj.model = this.modelIdData
    }
    if (this.yearIdData) {
      obj.modelYear = this.yearIdData
    }

    if (this.companyIdData) {
      obj.makeList = this.companyIdData
    }

    if (this.fuelIdData) {
      obj.primaryFuelType = this.fuelIdData
    }

    if (this.stateIdData) {
      obj.state = this.stateIdData
    }

    this.userService.getFleetSummaryTCO(obj).subscribe(data => {
      this.fleetSummary = data
    })
  }

  getImportData(){
    let obj: any = {}
    obj.fleetId = this.fleetId
    if (this.makeIdData) {
      obj.provider = this.makeIdData
    }
    if (this.modelIdData) {
      obj.model = this.modelIdData
    }
    if (this.yearIdData) {
      obj.modelYear = this.yearIdData
    }

    if (this.companyIdData) {
      obj.makeList = this.companyIdData
    }

    if (this.fuelIdData) {
      obj.primaryFuelType = this.fuelIdData
    }


    if (this.stateIdData) {
      obj.state = this.stateIdData
    }

    this.userService.getFleetSummaryTCO(obj).subscribe(data => {
      this.fleetSummary = data
      this.exportToExcel(this.fleetSummary, 'FleetSummary','','');

    })
  }

  exportToExcel(jsonData: any[], fileName: string, fleetId: string, state: string) {
    // Define the desired headers
    const headers = ['Provider', 'Make', 'Model', 'Year', 'Class', 'Body Type', 'Fuel Type', 'Vehicles'];

    // Map the JSON data to match the desired headers
    const mappedData = jsonData.map(item => ({
      Provider: item.provider,
      Make: item.make,
      Model: item.model,
      Year: item.modelYear,
      Class: item.vehicleType,
      'Body Type': item.bodyClass,
      'Fuel Type': item.primaryFuelType,
      Vehicles: item.count
    }));

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create an empty worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([
      // Custom headers with merged cells
      [`Fleet Id: ${this.fleetIdData}`, '', '', '', '', '', '', ''],
      [`State: ${this.costData?.state}`, '', '', '', '', '', '', ''],
      [``,'', '', '', '', '', '', ''],
      // Table headers
      headers
    ]);

    worksheet['A1'].s = {
      font: {
        bold: true
      }
    };
    worksheet['A2'].s = {
      font: {
        bold: true
      }
    };
    // Merge cells for Fleet Id and State
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Merge first row for Fleet Id
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }  // Merge second row for State
    ];

    // Convert mapped data to worksheet
    XLSX.utils.sheet_add_json(worksheet, mappedData, { header: headers, skipHeader: true, origin: -1 });

    // Set column width
    const colWidth = 16; // Adjust as needed
    worksheet['!cols'] = headers.map(() => ({ width: colWidth }));

    // Apply styles to the custom headers row (row 0 and row 1) and table headers row (row 2)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      // Style Fleet Id row (row 0)
      const fleetIdAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
      if (worksheet[fleetIdAddress]) {
        worksheet[fleetIdAddress].s = {
          font: {
            name: 'Arial', // Change to a standard font if needed
            sz: 12, // Font size
            color: { rgb: '000000' } // Font color (for custom header)
          },
          fill: {
            fgColor: { rgb: 'CCCCCC' } // Background color (for custom header)
          },
          alignment: {
            horizontal: 'center', // Horizontal alignment
            vertical: 'center' // Vertical alignment
          }
        };
      }

      // Style State row (row 1)
      const stateAddress = XLSX.utils.encode_cell({ c: C, r: 1 });
      if (worksheet[stateAddress]) {
        worksheet[stateAddress].s = {
          font: {
            name: 'Arial', // Change to a standard font if needed
            sz: 12, // Font size
            color: { rgb: '000000' } // Font color (for custom header)
          },
          fill: {
            fgColor: { rgb: 'CCCCCC' } // Background color (for custom header)
          },
          alignment: {
            horizontal: 'center', // Horizontal alignment
            vertical: 'center' // Vertical alignment
          }
        };
      }

      // Style table headers row (row 2)
      const headerAddress = XLSX.utils.encode_cell({ c: C, r: 2 });
      if (worksheet[headerAddress]) {
        worksheet[headerAddress].s = {
          font: {
            name: 'Arial', // Change to a standard font if needed
            sz: 12, // Font size
            color: { rgb: 'FFFFFF' } // Font color (for table headers)
          },
          fill: {
            fgColor: { rgb: '000000' } // Background color (for table headers)
          },
          alignment: {
            horizontal: 'center', // Horizontal alignment
            vertical: 'center' // Vertical alignment
          }
        };
      }
    }

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles in fleet');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  tcosearchPage() {
    this.yearIdData = null
    this.makeIdData = null
    this.modelIdData = null
    this.companyIdData = null
    this.fuelIdData = null
    this.stateIdData = null
    this.getAllData()
    this.spinner.hide()
  }

  redirect() {
    this.router.navigate(['/adlp/developer-corner/tcosearch'])
  }

  maskVinNumber(_vinNumber: any) {
    var mask = "";
    if (_vinNumber) {
      for (let i = 1; i <= _vinNumber.length - 4; i++) {
        mask += "*";
      }
      return mask + _vinNumber.slice(12, 16);
    }
    else {
      return null;
    }
  }

  getVehicle() {
    this.spinner.show()
    this.btnstatus = false
    this.btnstatusByStatus = false
    this.subscription$.add(
      this.userService.getAllVehicles().subscribe(res => {
        this.vehicleData = res;
        this.vins = this.vehicleData.map(res => {
          return res.vin
        })
        setTimeout(() => {
          this.spinner.hide()
        }, 4000)
      }, err => {
        this.spinner.hide()
      })
    )
  }

  numbersOnlyUpto(event: any) {
    const pattern = /[0-9, .]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (event.target.value.length > 11) {
      event.preventDefault();
    }
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  selectOem(oem) {
    this.spinner.show
    this.subscription$.add(
      this.userService.vinDetails(oem).subscribe((res: any) => {
        this.getstellantisVin = res;
        this.spinner.hide()
      }, err => {
        this.spinner.hide()
      }))
  }

  submit(id) {
    this.detailsofTco = true;
    this.getstatus();
  }

  getstatus() {
    this.spinner.show()
    this.subscription$.add(
      this.userService.vinDecode(this.oemVin).subscribe((res: any) => {
        this.spinner.hide()
        let data = JSON.parse(res)
        this.profileVehicle = data.Results[0]
        this.getAllData()
      }, err => {
        this.spinner.hide()
      }))
  }

  getVINdata(vinDetail) {
    this.costData = vinDetail
    let currentYear: any = new Date().getFullYear()
    this.noofVehicles = this.costData?.numberOfVehicles
    this.totalFuelConsumedData = this.costData?.cxTotalFuelConsumedPerYear
    this.totalFuelConsumedData = this.totalFuelConsumedData / this.costData?.numberOfVehicles
    this.totalFuelCost = Number(((this.totalFuelConsumedData / this.costData?.numberOfVehicles) * parseFloat(this.costData?.fuelCostInDollarPerGallon)))
    // this.totalFuelCost = Math.trunc(this.totalFuelCost * Math.pow(10, 2)) / Math.pow(10, 2)
    this.totalFuelCost = (this.totalFuelConsumedData) * parseFloat(this.costData?.fuelCostInDollarPerGallon.toFixed(2))
    this.depriciationAnuualMiles = this.VehicleWithdepreciationCost
    this.gallonCost = parseFloat(this.costData?.fuelCostInDollarPerGallon)
    this.mileagePerMile = (parseFloat(this.costData?.mileagePerYearInMiles[currentYear]) / this.costData?.numberOfVehicles)
    this.annualFueldollarpermiles = (this.totalFuelCost) / this.mileagePerMile
    let currentFuelCost: any = this.costData?.fuelCostInDollarPerYear[currentYear] ? parseFloat(this.costData?.fuelCostInDollarPerYear[currentYear].toFixed(2)) : null
    let milesPerCost = this.mileagePerMile ? currentFuelCost / this.mileagePerMile : null
    this.milesPerCost = milesPerCost ? Number(milesPerCost.toFixed(2)) : null
    this.milesPerCost = this.milesPerCost
    let categoriesData = Object.keys(this.costData?.totalEstimatedYearlyCost)
    let annualData = Object.values((this.costData?.totalEstimatedYearlyCost)).map((item: any) => { return Number((Number(item) / this.costData?.numberOfVehicles).toFixed(2)) })
    let mileData = Object.values(this.costData?.fuelCostInDollarPerYear).map((item: any) => { return Number(item) })
    let mileage = this.mileagePerMile
    var perMileCost: any = annualData.map(function (n, i) { return (n) / mileage; });
    perMileCost = perMileCost.map((res: any) => { return Number((Number(res.toFixed(2)))) })
    this.depreciationCost = this.costData?.yearlyDepreciationCostInDollarPerYear[currentYear + 1]
    this.vehicleCost = (this.costData?.basePrice ? Number(this.costData?.basePrice) : 0) / this.costData?.numberOfVehicles
    this.VehicleWithdepreciationCost = (this.vehicleCost) * (this.depreciationCost / 100)
    this.VehicleWithdepreciationCosts = (this.vehicleCost * this.noofVehicles) * (this.depreciationCost / 100)
    this.totalFuelConsumed = this.costData?.totalFuelConsumed
    this.annualDepriciationCostperdoller = this.VehicleWithdepreciationCost / this.mileagePerMile
    this.insuranceCost = Number(((this.costData?.annualInsurance ? this.costData?.annualInsurance : 0) / this.costData?.numberOfVehicles).toFixed(2))
    this.mainteannceCost = Number(((this.costData.annualMaintenance) / this.costData?.numberOfVehicles).toFixed(2))
    this.mainteannceCosts = Number(this.costData.annualMaintenance.toFixed(2))
    this.stateTax = Number((this.costData?.stateFee / this.costData?.numberOfVehicles).toFixed(2))
    this.totalAnnualCost = Number(this.totalFuelCost + this.VehicleWithdepreciationCost + this.mainteannceCost + this.insuranceCost + this.stateTax)
    this.mainCostAnnaual = this.totalAnnualCost
    this.totalMilesCost = this.annualFueldollarpermiles + this.annualDepriciationCostperdoller + (this.mainteannceCost / this.mileagePerMile) + ((this.insuranceCost + this.stateTax) / this.mileagePerMile)
    this.othersCost = this.insuranceCost + this.stateTax
    this.depriCost = this.VehicleWithdepreciationCost + this.mainteannceCost
    this.totalMilesCost = (this.annualFueldollarpermiles + (this.depriCost / this.mileagePerMile) + (this.othersCost / this.mileagePerMile))
    this.MilesCost = this.totalMilesCost
    annualData[0] = Number(((this.costData?.totalCostAnnualProjection ? this.costData?.totalCostAnnualProjection : 0)).toFixed(2))
    perMileCost[0] = Number(this.MilesCost).toFixed(2)
    this.MilesCostCal = perMileCost[0]
    // this.chartProjection(perMileCost, annualData)

  }

  afterDot(data: any) {
    return Math.trunc(data * Math.pow(10, 2)) / Math.pow(10, 2)
  }

  enablebtn() {
    this.Isdisabled = false
    this.options = Object.assign({}, this.options, { disabled: this.Isdisabled });
  }

  changeMileage() {
    this.subscription$.add(
      this.userService.getFleetMileageData(this.fleetId, this.mileagePerMile).subscribe((res: any) => {
        this.getVINdata(res)
      })
    )
  }


  largeModal(largeDataModal: any) {
    this.modalService.open(largeDataModal, { size: 'sl', centered: true });
    this.getFLeetList()
    this.fleetIdData = this.fleetId
    this.compareFleet(this.fleetId)
    this.tcoCompareVinList()
  }

  compareFleet(evt: any) {
    let obj: any = {}
    obj.fleetId = evt
    if (evt) {
      this.spinner.show()
      this.subscription$.add(
        this.userService.getFleetDetailTCO(obj).subscribe((res: any) => {
          this.spinner.hide()
          this.compareFleetData = res
        }, err => {
          this.spinner.hide()
        })
      )
    } else {
      this.compareFleetData = null
    }
  }

  getFLeetList() {
    this.spinner.show()
    this.subscription$.add(
      this.userService.getAllFleets().subscribe((res: any) => {
        this.fleetList = res
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        this.spinner.hide()
      }, err => { this.spinner.hide() })
    )
  }

  clearCompare() {
    this.fleetIdData = null
    this.compareFleetData = null
  }


  openModel() {
    this.modalService.open(this.modalContent, { size: 'sx', centered: true });
  }

  openModelFleet() {
    this.modalService.open(this.modelContent1, { size: 'sx', centered: true })
  }

  viewMoreData(dataList: any){
    this.modalService.open(dataList, { size: 'xl', centered: true });
  }

  ngOnDestroy() {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  viewYear(index) {
    this.chartIndex = index
    this.chartTcoForVIN()
  }

  chartTcoForVIN() {
    let seriseData = []
    if (this.chartIndex == 3) {
      this.allTco = {
        fuelCost: Number((this.tcoChartData?.fuelData[0] + this.tcoChartData?.fuelData[1] + this.tcoChartData?.fuelData[2]).toFixed(2)),
        depreciationCost: Number((this.tcoChartData?.depreciationData[0] + this.tcoChartData?.depreciationData[1] + this.tcoChartData?.depreciationData[2]).toFixed(2)),
        maintenanceCost: Number((this.tcoChartData?.maintenanceData[0] + this.tcoChartData?.maintenanceData[1] + this.tcoChartData?.maintenanceData[2]).toFixed(2)),
        insuranceCost: Number((this.tcoChartData?.insuranceData[0] + this.tcoChartData?.insuranceData[1] + this.tcoChartData?.insuranceData[2]).toFixed(2)),
        stateCost: Number((this.tcoChartData?.stateData[0] + this.tcoChartData?.stateData[1] + this.tcoChartData?.stateData[2]).toFixed(2)),
        annualMileData: this.tcoChartData?.annualMileData[0] + this.tcoChartData?.annualMileData[1] + this.tcoChartData?.annualMileData[2],
        annualChartData: this.tcoChartData?.annualChartData[0] + this.tcoChartData?.annualChartData[1] + this.tcoChartData?.annualChartData[2],

      }
      seriseData = [Number((Number((this.tcoChartData?.fuelData[0] + this.tcoChartData?.fuelData[1] + this.tcoChartData?.fuelData[2]).toFixed(2)) / this.noofVehicles).toFixed(2)),
      Number((Number(this.tcoChartData?.depreciationData[0] + this.tcoChartData?.depreciationData[1] + this.tcoChartData?.depreciationData[2]) / this.noofVehicles).toFixed(2)),
      Number((Number(this.tcoChartData?.maintenanceData[0] + this.tcoChartData?.maintenanceData[1] + this.tcoChartData?.maintenanceData[2]) / this.noofVehicles).toFixed(2)),
      Number((Number((this.tcoChartData?.insuranceData[0] + this.tcoChartData?.insuranceData[1] + this.tcoChartData?.insuranceData[2]).toFixed(2)) / this.noofVehicles).toFixed(2)),
      Number((Number((this.tcoChartData?.stateData[0] + this.tcoChartData?.stateData[1] + this.tcoChartData?.stateData[2]).toFixed(2)) / this.noofVehicles).toFixed(2)),
      Number((Number((this.tcoChartData?.annualChartData[0] + this.tcoChartData?.annualChartData[1] + this.tcoChartData?.annualChartData[2]).toFixed(2)) / this.noofVehicles).toFixed(2))]
    }
    else {
      seriseData = [Number((this.tcoChartData?.fuelData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.depreciationData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.maintenanceData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.insuranceData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.stateData[this.chartIndex] / this.noofVehicles).toFixed(2))]
    }


    seriseData = seriseData.map(value => isNaN(value) ? 0 : value);
    this.chartOptionsvin = {
      series: seriseData,
      chart: {
        width: '130%',
        height:"320",
        type: "donut",
      },
      dataLabels: {
        enabled: false // Disable data labels to remove percentages on the chart
      },
      legend: {
        show: false,
      },
      labels: ['Fuel Cost', 'Depreciation Cost', 'Maintenance Cost', 'Insurance Cost', 'State Fees'],
      colors: ['#779EF1', '#63EABE', '#EB5252', '#FF8080', '#4DDE76'],
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 90,
          offsetY: 10,
          donut: {
            size: '88%' // Set the thickness of the donut chart here
          }
        }
      },
      tooltip: {
        custom: function (opts) {
          const value = opts.w.globals.seriesPercent[opts.seriesIndex][0].toFixed(1);
          return `
            <div class="custom-tooltip">
              <div class="custom-tooltip-text">${value}%</div>
            </div>`;
        }
      },
      grid: {
        padding: {
          left: -0
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              show: false,
            }
          }
        }
      ],

    };
  }

  chartTcoForVINs() {
    let seriseData = []
    if (this.chartIndex == 3) {
      this.allTco = {
        fuelCost: Number((this.tcoChartData?.fuelData[0] + this.tcoChartData?.fuelData[1] + this.tcoChartData?.fuelData[2]).toFixed(2)),
        depreciationCost: Number((this.tcoChartData?.depreciationData[0] + this.tcoChartData?.depreciationData[1] + this.tcoChartData?.depreciationData[2]).toFixed(2)),
        maintenanceCost: Number((this.tcoChartData?.maintenanceData[0] + this.tcoChartData?.maintenanceData[1] + this.tcoChartData?.maintenanceData[2]).toFixed(2)),
        insuranceCost: Number((this.tcoChartData?.insuranceData[0] + this.tcoChartData?.insuranceData[1] + this.tcoChartData?.insuranceData[2]).toFixed(2)),
        stateCost: Number((this.tcoChartData?.stateData[0] + this.tcoChartData?.stateData[1] + this.tcoChartData?.stateData[2]).toFixed(2)),
        annualMileData: this.tcoChartData?.annualMileData[0] + this.tcoChartData?.annualMileData[1] + this.tcoChartData?.annualMileData[2],
        annualChartData: this.tcoChartData?.annualChartData[0] + this.tcoChartData?.annualChartData[1] + this.tcoChartData?.annualChartData[2],

      }
      seriseData = [Number((Number((this.tcoChartData?.fuelData[0] + this.tcoChartData?.fuelData[1] + this.tcoChartData?.fuelData[2]).toFixed(2)) / this.noofVehicles).toFixed(2)),
      Number((Number(this.tcoChartData?.depreciationData[0] + this.tcoChartData?.depreciationData[1] + this.tcoChartData?.depreciationData[2]) / this.noofVehicles).toFixed(2)),
      Number((Number(this.tcoChartData?.maintenanceData[0] + this.tcoChartData?.maintenanceData[1] + this.tcoChartData?.maintenanceData[2]) / this.noofVehicles).toFixed(2)),
      Number((Number((this.tcoChartData?.insuranceData[0] + this.tcoChartData?.insuranceData[1] + this.tcoChartData?.insuranceData[2]).toFixed(2)) / this.noofVehicles).toFixed(2)),
      Number((Number((this.tcoChartData?.stateData[0] + this.tcoChartData?.stateData[1] + this.tcoChartData?.stateData[2]).toFixed(2)) / this.noofVehicles).toFixed(2)),
      Number((Number((this.tcoChartData?.annualChartData[0] + this.tcoChartData?.annualChartData[1] + this.tcoChartData?.annualChartData[2]).toFixed(2)) / this.noofVehicles).toFixed(2))]
    }
    else {
      seriseData = [Number((this.tcoChartData?.fuelData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.depreciationData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.maintenanceData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.insuranceData[this.chartIndex] / this.noofVehicles).toFixed(2)), Number((this.tcoChartData?.stateData[this.chartIndex] / this.noofVehicles).toFixed(2))]
    }

    seriseData = seriseData.map(value => isNaN(value) ? 0 : value);
    this.chartOptionsvin = {
      series: seriseData,
      chart: {
        width: '130%',
        height:"320",
        type: "donut",
      },
      dataLabels: {
        enabled: false // Disable data labels to remove percentages on the chart
      },
      legend: {
        show: false,
      },
      labels: ['Fuel Cost', 'Depreciation Cost', 'Maintenance Cost', 'Insurance Cost', 'State Fees'],
      colors: ['#779EF1', '#63EABE', '#EB5252', '#FF8080', '#4DDE76'],
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 90,
          offsetY: 10,
          donut: {
            size: '88%' // Set the thickness of the donut chart here
          }
        }
      },
      tooltip: {
        custom: function (opts) {
          const value = opts.w.globals.seriesPercent[opts.seriesIndex][0].toFixed(1);
          return `
            <div class="custom-tooltip">
              <div class="custom-tooltip-text">${value}%</div>
            </div>`;
        }
      },
      grid: {
        padding: {
          left: -0
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              show: false,
            }
          }
        }
      ],

    };
  }

  selectVin() {
    this.selectVinOption = true;
    this.selectFleetOption = false
  }

  selectFleet() {
    this.selectVinOption = false;
    this.selectFleetOption = true;
  }

  comapreFleet() {
    this.router.navigate(['adlp/dashboards/compareTco'])
  }

  tcoCompareVinList() {
    this.userService.getCompareVinList().subscribe((res: any) => {
      this.tcoVinList = res?.vin
    }
    )
  }

  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
  }



}
