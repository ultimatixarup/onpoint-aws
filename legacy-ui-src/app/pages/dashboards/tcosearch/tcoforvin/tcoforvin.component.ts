import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { TaxonomyService } from '../../taxonomy.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Options } from 'ng5-slider';
import { ActivatedRoute, Router } from '@angular/router';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexMarkers, ApexYAxis, ApexGrid, ApexTitleSubtitle, ApexLegend } from "ng-apexcharts";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
export type ChartOptions = { series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis; stroke: ApexStroke; dataLabels: ApexDataLabels; markers: ApexMarkers; tooltip: any; yaxis: ApexYAxis; grid: ApexGrid; legend: ApexLegend; title: ApexTitleSubtitle };


@Component({
  selector: 'app-tcoforvin',
  templateUrl: './tcoforvin.component.html',
  styleUrls: ['./tcoforvin.component.scss']
})
export class TcoforvinComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  btnstatusByStatus: boolean;
  Isdisabled: boolean = true
  consumer: any = 'All'
  Isdisabled1: boolean = true
  Isdisabled4: boolean = true
  Isdisabled3: boolean = true;
  btnstatus: boolean = false;
  statusBtn: boolean = false
  fuel: boolean = false
  toggle = true
  temp: any;
  stellantisUs: any;
  vins: any;
  vehicleData: any;
  oem: any;
  profileVehicle: any;
  providerData: any[];
  provderList: any[];
  selectoem: any = '';
  getstellantisVin: any;
  oemVin: any = ''
  detailStatus: boolean = false
  detailsofTco: boolean = false
  total: number;
  Isdisabled5: boolean = true;
  enable: boolean = false;
  costData: any;
  vinList: any;
  NewCostData: any;
  depreciation: boolean = false
  fuelcosts: boolean = true;
  maitenance: boolean = false;
  others: boolean = false;
  value: number = 0;
  options: Options = {
    floor: 0,
    ceil: 10,
    step: 0.01,
    disabled: true,
  };
  Option1: Options = Object.assign({}, this.options, { disabled: true })
  value1: number = 0;
  options1: Options = {
    floor: 0,
    ceil: 10,
    step: 0.01,
    disabled: true,
  };
  chartOptions: any;
  chartOptionstco: any;
  chartOptionsFuelCost: any;
  chartOptionsMileage: any;
  chartOptionsDepriciation: any
  // end
  chartOptionsMaintenance: any
  chartOptionInsurance: any
  chartOptionState: any
  chartOptionsvin: any;
  sub: any;
  selectVin: any;
  tcoDetail: any;
  totalMilesCost: any;
  gallonCost: any;
  mileagePerMile: any
  averageCostMile: any
  vehicleCost: any;
  vehiclHealth: any = 'good'
  maintenanceRepairCost: any;
  insuranceCost: any;
  milesPerCost: any;
  maintenanceCosts: any;
  repairCost: any;
  depreciationCost: any;
  totalAnnualCost: any;
  tollFee: number = 0;
  mainteannceCost: any;
  stateTax: any;
  VehicleWithdepreciationCost: any;
  VINsummary: any;
  FleetSummary: any;
  annualFuelCost: number;
  annualFueldollarpermiles: number;
  depriciationAnuualMiles: any;
  totalFuelConsumed: any;
  annualDepriciationCostperdoller: number;
  mainCostAnnaual: any;
  annualFuelConsumed: any;
  mySubscription;
  othersCost: any;
  depriCost: number;
  MilesCost: any;
  fleetList: any;
  fleets: any;
  fleetId: any;
  oemData: any[];
  mileage: any;
  annualFueldollarpermilesCompare: number;
  actualAverageDollarPerMiles: number;
  fuelConsumed: any;
  annualCostFuel: number;
  baseForFleet: any;
  maintenanceForFleet: number;
  depriciationForFleet: number;
  depriciationDollarperMiles: number;
  insuranceforFleet: number;
  stateTaxForFleet: number;
  vinData: any
  otherAnnualCost: any;
  fleetIdData: any;
  otherAnnualDollarCost: number;
  gallonCost1: any;
  @ViewChild("largeNoDataFound") modalContent: TemplateRef<any>;
  depriciationForFleetAnnual: number;
  noofVehicles: any;
  currentYear: any = new Date().getFullYear()
  projectionCategoryData = [this.currentYear, this.currentYear + 1, this.currentYear + 2]
  tcoChartData: any = { fuelData: [], depreciationData: [], maintenanceData: [], insuranceData: [], stateData: [], annualChartData: [], annualMileData: [], fuelMileData: [], depreciationMileData: [], maintenanceMileData: [], insuranceMileData: [], stateMileData: [] };
  chartIndex = 0
  allTco: any = {
    fuelCost: 0,
    depreciationCost: 0,
    maintenanceCost: 0,
    insuranceCost: 0,
    stateCost: 0,
    annualMileData: 0,
    annualChartData: 0
  };
  annualProjection: any;
  user: any;
  multiRoles: any;
  customConsumer: any;
  constructor(  private cd: ChangeDetectorRef, private modalService: NgbModal, private spinner: NgxSpinnerService, private route: ActivatedRoute, private router: Router, private userService: TaxonomyService, private http: HttpClient) {


  }
  ngOnInit(): void {
    this.vinListData()
    this.getVin()
    this.fetchData()
    this. showRole()
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
      this.chartAnnualProjection([], [], [])
      this.chartFuelCostProjection([], [])
      this.chartMileageProjection([], [])
      this.chartDepriciation([], [])
      this.chartMaintenance([])
      this.chartInsurance([])
      this.chartState([])
      this.VINChart([])
      this.cd.detectChanges();
    } catch (error) {
    }
  }

  viewMore(): void {
    if (this.consumer && this.consumer !== 'All') {
      this.router.navigate(['/adlp/admin/manageVehicle'], { queryParams: { consumer: this.consumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/manageVehicle']);
    }
  }
  chartAnnualProjection(newmileData, annualChartData, categoriesData) {
    annualChartData = this.costData?.totalCostAnnualProjection ? Object.values(this.costData?.totalCostAnnualProjection)
      .slice(0, 3).map((item: any) => { return Number((Number(item)).toFixed(2)) }) : [];
    newmileData = this.costData?.totalCostAnnualProjection
      ? Object.values(this.costData?.totalCostAnnualProjection)
        .slice(0, 3)
        .map((item: any) => Number(((Number(item) / this.costData?.totalDistanceOfCurrentYear)).toFixed(2)))
      : [];

    this.chartOptionstco = {
      series: [
        {
          name: "",
          data: annualChartData,
          type: "bar",
          color: '#FF8531',
        },
        {
          name: "",
          data: newmileData,
          type: "bar",
          color: '#FFBD8F',
        },
      ],
      chart: {
        height: 290,
        type: "bar",
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
        size: 10,
        hover: {
          sizeOffset: 6
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: ["2024", "2025", "2026"],
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
          show: true, // Enable vertical grid lines
          borderColor: "#F0F0F0", // Color of the vertical border
          borderWidth: 1, // Width of the vertical border
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
          axisTicks: {
            show: false,
          },
        },
        {
          opposite: true,
          title: {
            offsetX: 0,
            offsetY: 74,
            text: "Cost Per Mile"
          },
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
        borderColor: '#F0F0F0',
        xaxis: {
          lines: {
            show: false, // Enable vertical grid lines
            left: 40,
          },
        },
        yaxis: {
          lines: {
            show: false, // Enable vertical grid lines
          },
        },
      },
      annotations: {
        xaxis: [
          {
            x: '2024',
            borderColor: '#000000',
            borderWidth: 2,
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
            borderWidth: 2,
            label: {
              style: {
                color: '#000000',
              },
              position: 'top',
            }
          },
          {
            x: '2026',
            borderColor: '#000000',
            borderWidth: 2,
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

  chartFuelCostProjection(fuelCost, annualCost) {
    fuelCost.pop();
    annualCost.pop();
    this.tcoChartData.fuelData = fuelCost
    // fuelCost = this.costData?.fuelCostInDollarPerYear ? Object.values(this.costData?.fuelCostInDollarPerYear)
    // .slice(0, 3).map((item: any) => { return Number((Number(item)).toFixed(2)) }) : []
    annualCost = this.costData?.fuelCostInDollarPerYear
      ? Object.values(this.costData?.fuelCostInDollarPerYear)
        .slice(0, 3)
        .map((item: any) => Number(((Number(item) / this.costData?.totalDistanceOfCurrentYear)).toFixed(2)))
      : [];
    const maxTripCount = Math.max(...fuelCost);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    const maxTripCounts = Math.max(...annualCost);
    const xAxisMax = maxTripCounts > 5 ? Math.ceil(maxTripCounts / 10) * 10 : 10;
    this.chartOptionsFuelCost = {
      series: [

        {
          name: "Annual Fuel Cost ($)",
          data: fuelCost,
          type: "bar",
          color: '#8BB0FF',
        },
        {
          name: "Total Cost Per Miles ($)",
          data: annualCost,
          type: "bar",
          color: '#D8E4FF',
        },

      ],
      chart: {
        type: "bar",
        height: 290,
        width: 340,
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
        categories: ["2024", "2025", "2026"],
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
          min: 0,
          max: yAxisMax,
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
            offsetY: 74,
            text: "Cost Per Mile"
          },

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

  chartMileageProjection(mileage, annualCost) {
    let mileageCost = Object.values(mileage).slice(0, 3).map((item: any, index) => {
      return Number(item.toFixed(1))
    })
    this.chartOptionsMileage = {
      series: [
        {
          name: "Annual Mileage (miles) ",
          data: mileageCost,
          type: "bar"
        },
      ],
      chart: {
        height: 250,
        // // width:320,
        zoom: {
          enabled: false
        },
        toolbar: { show: false },
        // type: "line"
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          endingShape: "rounded"
        }
      },
      stroke: {
        show: true,
        width: 1,
        colors: ["transparent"]
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        labels: {
          trim: false
        },
        categories: this.projectionCategoryData
      },
      yaxis: [
        {
          title: {
            text: "Annual Mileage (In Thousands)"
          },
          labels: {
            formatter: function (val) {
              return (val / 1000).toFixed(2);
            }
          }

        },
        // {
        //   opposite: true,
        //   show:false,
        //   title: {
        //     text: ""
        //   },
        // }

      ],

      // tooltip: {
      //   y: [
      //     {
      //       title: {
      //         formatter: function (val) {
      //           return val;
      //         }
      //       }
      //     },
      //   ]
      // },

      grid: {
        borderColor: "#f1f1f1"
      }
    };
  }

  chartDepriciation(depreciationCost, mileage) {
    this.tcoChartData.depreciationData = this.costData?.yearlyDepreciationCostInDollarPerYear
      ? Object.values(this.costData?.yearlyDepreciationCostInDollarPerYear)
        .slice(0, 3).map((item: any) => { return Number((Number(item)).toFixed(2)) })
      : [];

    let annualCost = this.costData?.yearlyDepreciationCostInDollarPerYear
      ? Object.values(this.costData?.yearlyDepreciationCostInDollarPerYear)
        .slice(0, 3)
        .map((item: any) => Number(((Number(item) / this.costData?.totalDistanceOfCurrentYear)).toFixed(2)))
      : [];

    const maxTripCount = Math.max(...this.tcoChartData.depreciationData);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;

    const maxTripCounts = Math.max(...annualCost);
    const xAxisMax = maxTripCounts > 5 ? Math.ceil(maxTripCounts / 10) * 10 : 10;

    this.chartOptionsDepriciation = {
      series: [
        {
          name: "Annual Depreciation Cost ($)",
          data: this.tcoChartData.depreciationData,
          type: "bar",
          color: '#95D3BF',
        },
        {
          name: "Total Cost Per Mile ($)",
          data: annualCost,
          type: "bar",
          color: '#C4F2E3',
        },
      ],
      chart: {
        type: "bar",
        height: 290,
        width: 340,
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
        categories: ["2024", "2025", "2026"],
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
          min: 0,
          max: yAxisMax,
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
            offsetY: 74,
            text: "Cost Per Mile"
          },

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
        borderColor: "[transparent]",
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false,
            padding: {
              left: 50 // Set the left padding to 50px
            }
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        },
        row: {
          colors: undefined,
          opacity: 0.5
        },
        column: {
          colors: undefined,
          opacity: 0.5
        }
      },

    };
  }

  chartMaintenance(annualCost) {
    this.tcoChartData.maintenanceData = this.costData?.maintenanceCostInDollarPerYear ? Object.values(this.costData?.maintenanceCostInDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    annualCost = this.costData?.maintenanceCostInDollarPerYear
      ? Object.values(this.costData?.maintenanceCostInDollarPerYear)
        .slice(0, 3)
        .map((item: any) => Number(((Number(item) / this.costData?.totalDistanceOfCurrentYear)).toFixed(2)))
      : [];
    const maxTripCount = Math.max(...  this.tcoChartData.maintenanceData);
    const yAxisMax = maxTripCount > 5 ? Math.ceil(maxTripCount / 10) * 10 : 10;
    const maxTripCounts = Math.max(...annualCost);
    const xAxisMax = maxTripCounts > 5 ? Math.ceil(maxTripCounts / 10) * 10 : 10;
    this.chartOptionsMaintenance = {
      series: [
        {
          name: "Annual Maintenance Cost ($)",
          data: this.tcoChartData.maintenanceData,
          type: "bar",
          color: '#EB5252',
        },

        {
          name: "Total Cost Per Mile ($)",
          data: annualCost,
          type: "bar",
          color: '#FFB0B0',
        },

      ],
      chart: {
        type: "bar",
        height: 290,
        width: 340,
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
        categories: ["2024", "2025", "2026"],
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
          min: 0,
          max: yAxisMax,
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
            offsetY: 74,
            text: "Cost Per Mile"
          },

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
    this.tcoChartData.insuranceMileData = annualCost
    let insuranceData = this.costData?.insuranceFeeInCostDollarPerYear ? Object.values(this.costData?.insuranceFeeInCostDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(((Number(item) / this.noofVehicles) / 100).toFixed(2)) }) : []
    this.chartOptionInsurance = {
      series: [
        {
          name: "Total Cost Per Mile ($)",
          data: this.tcoChartData.insuranceData,
          type: "area"
        },
        {
          name: "Annual Insurance Cost ($)",
          data: insuranceData,
          type: "bar"
        },

      ],
      chart: {
        height: 280,
        width: 500,
        type: "line",
        stacked: false,
        // type: "line",
        zoom: {
          enabled: false
        },
        toolbar: { show: false },
        // type: "line"
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "20%",
          endingShape: "rounded"
        }
      },
      stroke: {
        show: true,
        width: 1,
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        labels: {
          trim: false
        },
        categories: this.projectionCategoryData
      },
      yaxis: [
        {
          title: {
            text: "Cost Per Mile"
          }
        },

        {
          opposite: true,
          title: {
            text: "Annual Cost $ *(100)"
          },
          labels: {
            formatter: function (val) {
              return val / 100;
            }
          }
        }
      ],

      tooltip: {
        y: [
          {
            title: {
              formatter: function (val) {
                return val;
              }
            }
          },
        ]
      },
      grid: {
        borderColor: "#f1f1f1"
      }
    };
  }

  chartState(annualCost) {
    this.tcoChartData.stateData = this.costData?.stateFeeInCostDollarPerYear ? Object.values(this.costData?.stateFeeInCostDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    this.tcoChartData.stateMileData = annualCost
    let stateData = this.costData?.stateFeeInCostDollarPerYear ? Object.values(this.costData?.stateFeeInCostDollarPerYear)
      .slice(0, 3).map((item: any) => { return Number(item.toFixed(2)) }) : []
    this.chartOptionState = {
      series: [

        {
          name: "Total Cost Per Mile ($)",
          data: annualCost,
          type: "bar"
        },
        {
          name: "Annual State Fee ($)",
          data: stateData,
          type: "bar"
        },
      ],
      chart: {
        height: 280,
        width: 500,
        type: "line",
        stacked: false,
        // type: "line",
        zoom: {
          enabled: false
        },
        toolbar: { show: false },
        // type: "line"
      },
      stroke: {
        width: [0, 2, 5],
        curve: "smooth"
      },
      plotOptions: {
        bar: {
          columnWidth: "50%"
        }
      },
      dataLabels: {
        enabled: false
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        labels: {
          trim: false
        },
        categories: this.projectionCategoryData
      },
      yaxis: [
        {
          title: {
            text: "Cost Per Mile"
          }
        },

        {
          opposite: true,
          title: {
            text: "Annual State Fees $ *(100)"
          },
          labels: {
            formatter: function (val) {
              return val / 100;
            }
          }
        }
      ],

      tooltip: {
        y: [
          {
            title: {
              formatter: function (val) {
                return val;
              }
            }
          },
        ]
      },
      grid: {
        borderColor: "#f1f1f1"
      }
    };
  }
  // NEW DESIGN TCO END

  getVin() {
    this.sub = this.route.queryParamMap.subscribe((params: any) => {
      this.selectVin = params.params['vin'] || 0;
      this.fleetId = params.params['fleetId'] || 0
      if (this.selectVin == 0 || this.fleetId == 0) {
        this.router.navigate(['adlp/developer-corner/tcosearch'])
      } else {
        // this.getAllData(this.selectVin)
        this.getAllData1(this.selectVin)
        this.getTcoDetailsData(this.selectVin)
        // this.getAllDataFleet();
      }
      this.spinner.hide()
    });
  }

  numbersOnly(event: any) {
    const pattern = /[A-Z, a-z]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  maskVinNumber(_vinNumber: any) {
    var mask = "";
    if (_vinNumber) {
      for (let i = 1; i <= _vinNumber.length - 4; i++) {
        mask += "*";
      }
      return mask + _vinNumber.slice(14, 22);
    }
    else {
      return null;
    }
  }

  tcosearchPage() {
    this.router.navigate(['/adlp/dashboards/tcosearch'])
  }
  internalServer: boolean = false;
  internalServer1: boolean = true;
  getAllData1(vin) {
    this.subscription$.add(
      this.userService.getTcoDatas(vin).subscribe((res: any) => {
        this.VINsummary = res
        if (this.VINsummary?.basePrice < 0) {
          this.openModel()
        }
        this.getVINdata(res)
        this.internalServer = false;
        this.internalServer1 = true;
      },
      (err => {
        this.spinner.hide()
        if (err.status === 500) {
          // this.appService.openSnackBar('Internal Server Error', 'Error');
          this.internalServer = true;
          this.internalServer1 = false;

        }
      }))
    )
  }

  openModel() {
    this.modalService.open(this.modalContent, { size: 'sx', centered: true });
  }

  async getVINdata(vinDetail) {
    this.costData = vinDetail
    let currentYear: any = new Date().getFullYear()
    let mileData = Object.values(this.costData?.fuelCostInDollarPerYear).map((item: any) => { return Number(item.toFixed(2)) })
    let categoriesData = Object.keys(this.costData?.totalEstimatedYearlyCost)
    let fuelCostperYear: any = Object.values(this.costData?.fuelCostInDollarPerYear).slice(0, 3)
    let mileagePerYear: any = Object.values(this.costData?.mileagePerYearInMiles).slice(0, 3)
    let totalfuelCost = fuelCostperYear.map((item: any, index) => { return Number((item / mileagePerYear[index]).toFixed(2)) })
    await this.chartFuelCostProjection(mileData, totalfuelCost)
    let totalDpreciationCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.yearlyDepreciationCostInDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })
    await this.chartDepriciation(totalDpreciationCost, mileagePerYear)
    let totalStateCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.stateFeeInCostDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })
    await this.chartState(totalStateCost)
    let totalInsuranceCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.insuranceFeeInCostDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })
    await this.chartInsurance(totalInsuranceCost)
    let totalMaintanaceCost: any = mileagePerYear.map((item: any, index) => {
      return Number((this.costData?.maintenanceCostInDollarPerYear[this.currentYear + index] / item).toFixed(2))
    })
    await this.chartMaintenance(totalMaintanaceCost)
    let totalmileageCost: any = Object.values(this.costData?.mileagePerYearInMiles).slice(0, 3).map((item: any, index) => { return Number((item / mileagePerYear[index]).toFixed(2)) })
    await this.chartMileageProjection(this.costData?.mileagePerYearInMiles, totalmileageCost)
    let chartDetail = this.tcoChartData
    let annualData = this.tcoChartData.fuelData.map(function (item, i) {
      return Number((item + chartDetail.depreciationData[i] + chartDetail.maintenanceData[i] + chartDetail.insuranceData[i] + chartDetail.stateData[i]).toFixed(2));
    })

    let perMileCost = this.tcoChartData.fuelMileData.map(function (item, i) {
      return item + chartDetail.depreciationMileData[i] + chartDetail.maintenanceMileData[i] + chartDetail.insuranceMileData[i] + chartDetail.stateMileData[i];
    })
    await this.chartAnnualProjection(perMileCost, annualData, categoriesData)
    this.chartTcoForVIN();
  }

  getTcoDetailsData(vin) {
    this.spinner.show()
    this.subscription$.add(
      this.userService.getTcoDetails(vin).subscribe((res: any) => {
        this.tcoDetail = res
        this.spinner.hide
      })
    )
  }

  enablebtn() {
    this.Isdisabled = false
    this.options = Object.assign({}, this.options, { disabled: this.Isdisabled });
  }

  // For Average Fleet
  getAllDataFleet() {
    this.spinner.show()
    this.subscription$.add(
      this.userService.getFleetDetails(this.fleetId).subscribe((res: any) => {
        this.FleetSummary = res
        let currentYear: any = new Date().getFullYear()
        this.mileage = this.FleetSummary?.mileagePerYearInMiles[currentYear] / this.FleetSummary?.numberOfVehicles
        this.gallonCost1 = this.FleetSummary?.fuelCostInDollarPerGallon
        this.fuelConsumed = this.FleetSummary?.cxTotalFuelConsumedPerYear
        this.annualFueldollarpermilesCompare = (this.fuelConsumed * this.gallonCost) / (this.mileage)
        this.actualAverageDollarPerMiles = this.annualFueldollarpermilesCompare / this.FleetSummary?.numberOfVehicles
        this.annualCostFuel = (this.fuelConsumed.toFixed(2) * this.gallonCost1.toFixed(2))
        this.baseForFleet = this.FleetSummary?.basePrice / this.FleetSummary?.numberOfVehicles
        this.maintenanceForFleet = this.FleetSummary?.annualMaintenance / this.FleetSummary?.numberOfVehicles
        this.depreciationCost = this.FleetSummary?.yearlyDepreciationCostInDollarPerYear[currentYear + 1]
        this.insuranceCost = this.FleetSummary?.stateFeeInCostDollarPerYear[currentYear + 1]
        this.depriciationForFleetAnnual = this.baseForFleet * (this.depreciationCost / 100)
        this.depriciationForFleet = this.baseForFleet * (this.depreciationCost / 100) + this.maintenanceForFleet
        this.depriciationDollarperMiles = this.depriciationForFleet / this.mileage
        this.insuranceforFleet = this.FleetSummary?.annualInsurance / this.FleetSummary?.numberOfVehicles
        this.stateTaxForFleet = this.FleetSummary?.stateFee / this.FleetSummary?.numberOfVehicles
        this.otherAnnualCost = this.insuranceforFleet + this.stateTaxForFleet
        this.otherAnnualDollarCost = this.otherAnnualCost / this.mileage
        this.noofVehicles = this.FleetSummary?.numberOfVehicles
        this.spinner.hide()
      }, (err => {
        this.spinner.hide()
      }))
    )
  }
  // For Average Fleet End

  largeModal(largeDataModal: any) {
    this.modalService.open(largeDataModal, { size: 'xl', centered: true });
    this.getAllDataFleet()
  }

  maintenanceModal(largeMaintenanceModal: any) {
    this.modalService.open(largeMaintenanceModal, { size: 'xl', centered: true });
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

  otherCostModal(largeOtherCostModal: any) {
    this.modalService.open(largeOtherCostModal, { size: 'xl', centered: true });
  }

  tcoBack() {
    this.router.navigate(['adlp/developer-corner/tcosearch'])
  }


  ngOnDestroy() {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    this.sub.unsubscribe();
  }

  viewYear(index) {
    this.chartIndex = index
    this.chartTcoForVIN()
  }

  chartTcoForVIN() {
    let seriseData = []
    if (this.chartIndex == 3) {
      this.allTco = {
        fuelCost: (this.tcoChartData?.fuelData[0] + this.tcoChartData?.fuelData[1] + this.tcoChartData?.fuelData[2]).toFixed(2),
        depreciationCost: ((this.tcoChartData?.depreciationData[0] + this.tcoChartData?.depreciationData[1] + this.tcoChartData?.depreciationData[2])),
        maintenanceCost: (this.tcoChartData?.maintenanceData[0] + this.tcoChartData?.maintenanceData[1] + this.tcoChartData?.maintenanceData[2]),
        insuranceCost: (this.tcoChartData?.insuranceData[0] + this.tcoChartData?.insuranceData[1] + this.tcoChartData?.insuranceData[2]),
        stateCost: (this.tcoChartData?.stateData[0] + this.tcoChartData?.stateData[1] + this.tcoChartData?.stateData[2]),
        // annualMileData:this.tcoChartData?.totalCostAnnualProjection[0] + this.tcoChartData?.totalCostAnnualProjection[1] + this.tcoChartData?.totalCostAnnualProjection[2],
        annualChartData: this.tcoChartData?.annualChartData[0] + this.tcoChartData?.annualChartData[1] + this.tcoChartData?.annualChartData[2]
      }

      seriseData = [Number((Number(this.tcoChartData?.fuelData[0] + this.tcoChartData?.fuelData[1] + this.tcoChartData?.fuelData[2])).toFixed(2)),
      Number((Number(this.tcoChartData?.depreciationData[0] + this.tcoChartData?.depreciationData[1] + this.tcoChartData?.depreciationData[2])).toFixed(2)),
      Number((Number(this.tcoChartData?.maintenanceData[0] + this.tcoChartData?.maintenanceData[1] + this.tcoChartData?.maintenanceData[2])).toFixed(2)),
      Number((Number(this.tcoChartData?.insuranceData[0] + this.tcoChartData?.insuranceData[1] + this.tcoChartData?.insuranceData[2])).toFixed(2)),
      (this.tcoChartData?.stateData[0] + this.tcoChartData?.stateData[1] + this.tcoChartData?.stateData[2])]
    }
    else {
      seriseData = [this.tcoChartData?.fuelData[this.chartIndex], Number(this.tcoChartData?.depreciationData[this.chartIndex]), Number(this.tcoChartData?.maintenanceData[this.chartIndex]), this.tcoChartData?.insuranceData[this.chartIndex], this.tcoChartData?.stateData[this.chartIndex]]
    }
    this.total = seriseData.reduce((sum, value) => sum + value, 0);
    this.VINChart(seriseData)
  }

  VINChart(seriseData) {
    this.chartOptionsvin = {
      series: seriseData,
      chart: {
        width: '130%',
        height: "330px", // Set the desired height here
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
        enabled: true,
        custom: function (opts) {
          const value = opts.w.globals.seriesPercent[opts.seriesIndex][0].toFixed(1);
          return `
            <div class="custom-tooltip">
              <div class="custom-tooltip-text">${value}%</div>
            </div>`;
        },
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
  vinListData() {
    this.subscription$.add(
      this.userService.getVINlistDataNew(this.fleetId).subscribe((res: any) => {
        this.vinList = res?.vin
      }))
  }
  isSidebarHidden = false;
  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden;
  }


}
