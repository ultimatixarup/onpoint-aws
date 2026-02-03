import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { TaxonomyService } from '../../taxonomy.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Options } from 'ng5-slider';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ChartComponent,
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
import { concatMap, exhaustMap, switchMap, take } from 'rxjs/operators';
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
  selector: 'app-comparetco',
  templateUrl: './comparetco.component.html',
  styleUrls: ['./comparetco.component.scss']
})
export class ComparetcoComponent implements OnInit {
  subscription$: Subscription = new Subscription();
  btnstatusByStatus: boolean;
  Isdisabled: boolean = true
  Isdisabled1: boolean = true
  Isdisabled4: boolean = true
  fleetIdData: any;
  compareVin: any;
  makeIdData: any = null;
  modelIdData: any = null;
  yearIdData: any = null;
  btnstatus: boolean = false;
  statusBtn: boolean = true;
  fuel: boolean = false
  toggle = true
  temp: any;
  stellantisUs: any;
  vins: any;
  vehicleData: any;
  compareFleetId: any
  selectVinOption:boolean = false
  oem: any;
  profileVehicle: any;
  providerData: any[];
  provderList: any[];
  selectoem: any = '';
  getstellantisVin: any;
  oemVin: any = ''
  detailStatus: boolean = false
  @ViewChild("largeNoDataFound") modalContent: TemplateRef<any>;
  @ViewChild("fleetlargeNoDataFound") modelContent1: TemplateRef<any>;
  detailsofTco: boolean = false
  enable: boolean = false;
  costData: any;
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
  consumer: any = 'All'
  currentYear: any = new Date().getFullYear()
  projectionCategoryData = [this.currentYear, this.currentYear + 1, this.currentYear + 2]
  yearList: any = [];
  chartOptionstco: any
  chartOptionsvin: any
  chartOptionsMileage: any
  chartOptionsDepriciation: any
  chartOptionsMaintenance: any
  chartOptionsFuelCost: any
  chartIndex:any=3
  allTco:any ={
    fuelCost:0,
    depreciationCost:0,
    maintenanceCost:0,
    insuranceCost:0,
    stateCost:0,
    annualMileData:0,
    annualChartData:0
  };
  tcoChartData: any = { fuelData: [], depreciationData: [], maintenanceData: [], insuranceData: [], stateData: [], annualChartData: [], annualMileData: [], fuelMileData: [], depreciationMileData: [], maintenanceMileData: [], insuranceMileData: [], stateMileData: [] };
  tcoVinList: any;
;
  constructor(private modalService: NgbModal, private spinner: NgxSpinnerService, private route: ActivatedRoute, private router: Router, private userService: TaxonomyService, private http: HttpClient) {
    this.chartProjection([], [], [])
    this.chartAnnualProjection()
    this.chartTcoForVIN()
    this.chartMileageProjection()
    this.chartDepriciation()
    this.chartMaintenance()
    this.chartFuelCostProjection()

  }

  ngOnInit(): void {
    this.loadDsata()
    this.tcoCompareVinList()
    this.getFLeetList()
  }

  viewMore(): void {
    if (this.consumer && this.consumer !== 'All') {
      this.router.navigate(['/adlp/admin/manageVehicle'], { queryParams: { consumer: this.consumer, fleetId: this.fleetIdData } })
    } else {
      this.router.navigate(['/adlp/admin/manageVehicle']);
    }
  }


  // Chart for New TCO FLEET //

  chartAnnualProjection() {
    this.chartOptionstco = {
      series: [
        {
          name: "Total Annual Cost($)",
          data: [7.90, 9.12, 11.43],
          type: "bar"
        },
        {
          name: "Comapre Total Annual Cost($)",
          data: [8.90, 11.12, 14.43],
          type: "bar"
        },
        {
          name: "Total Cost per Mile ($)",
          data: [1.32, 1.67, 1.90],
          type: "line"
        },
        {
          name: "Compare Total Cost per Mile ($)",
          data: [1.62, 1.87, 2.10],
          type: "line"
        },
      ],
      chart: {
        height: 290,
        // width:320,
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
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        tooltipHoverFormatter: function (val) {
          return (
            val
          );
        }
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
        categories: ["2023", "2024", "2025"]
      },
      yaxis: [
        {
          title: {
            text: "Total Annual Cost $(In Thousands)"
          },
          // labels: {
          //   formatter: function (val) {
          //     return (val / 1000).toFixed(2);
          //   }
          // }

        },
        {
          opposite: true,
          title: {
            text: "Total Cost Per Mile"
          },
          // labels: {
          //   formatter: function (val) {
          //     return (val).toFixed(2);
          //   }
          // }
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

  chartMileageProjection() {
   this.chartOptionsMileage = {
      series: [
        {
          name: "Annual Mileage (mile/year) ",
          data: [14220, 16780, 19820],
          type: "bar"
        },
        {
          name: "Comapre Annual Mileage (mile/year) ",
          data: [10120, 11239, 9827],
          type: "bar"
        }

      ],
      chart: {
        height: 290,
        // width:260,
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
        categories: ["2023", "2024", "2025"]
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
        {
          opposite: true,
          show:false,
          title: {
            text: ""
          },
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

  chartFuelCostProjection() {
    this.chartOptionsFuelCost = {
       series: [
         {
           name: "Annual Fuel Cost ($)",
           data: [3.45, 3.78, 4.02],
           type: "bar"
         },
         {
           name: "Comapre Annual Fuel Cost ($)",
           data: [4.12, 4.26, 4.39],
           type: "bar"
         },
         {
           name: "Total Cost Per Mile ($)",
           data: [0.45, 0.56, 0.68],
           type: "line"
         },
         {
           name: "Comapre Total Cost Per Mile ($)",
           data: [0.78, 0.87, 0.98],
           type: "line"
         },

       ],
       chart: {
         height: 290,
         // width:320,
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
         categories: ["2023", "2024", "2025"]
       },
       yaxis: [
         {
           title: {
             text: "Annual Fuel Cost (In Hundreds)"
           },
           // labels: {
           //   formatter: function (val) {
           //     return (val/100).toFixed(2);
           //   }
           // }
         },
         {
           opposite: true,
           title: {
             text: "Total Cost Per Mile"
           },

         }
       ],

       tooltip: {
         y: [
           {
             // title: {
             //   formatter: function (val) {
             //     return val;
             //   }
             // }
           },
         ]
       },
       grid: {
         borderColor: "#f1f1f1"
       }
     };
   }

  chartDepriciation() {
  this.chartOptionsDepriciation = {
      series: [
        {
          name: "Annual Depreciation Cost ($)",
          data: [4320, 6578, 9673],
          type: "bar"
        },
        {
          name: "Compare Depreciation Cost ($)",
          data: [4320, 6578, 9673],
          type: "bar"
        },
        {
          name: "Total Cost Per Mile ($)",
          data: [0.56, 0.78, 0.99],
          type: "line"
        },
        {
          name: "Compare Total Cost Per Mile ($)",
          data: [0.76, 0.91, 1.32],
          type: "line"
        },
      ],
      chart: {
        height: 290,
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
        categories: ["2023", "2024", "2025"]
      },
      yaxis: [
        {
          title: {
            text: "Annual Depreciation Cost (In Hundreds)"
          },
          // labels: {
          //   formatter: function (val) {
          //     return (val/100).toFixed(2);
          //   }
          // }
        },

        {
          opposite: true,
          title: {
            text: "Total Cost Per Mile"
          },
        }
      ],

      tooltip: {
        y: [
          {
            // title: {
            //   formatter: function (val) {
            //     return val;
            //   }
            // }
          },
        ]
      },
      grid: {
        borderColor: "#f1f1f1"
      }
    };
  }

  chartMaintenance() {
  this.chartOptionsMaintenance = {
      series: [
        {
          name: "Annual Maintenance Cost ($)",
          data: [3245, 3678, 3918],
          type:"bar"
        },
        {
          name: "Annual Maintenance Cost ($)",
          data: [3560, 3789, 3989],
          type:"bar"
        },
        {
          name: "Total Cost Per Mile ($)",
          data: [0.57, 0.68, 0.78],
          type:"line"
        },
        {
          name: "Compare Total Cost Per Mile ($)",
          data: [0.87, 0.98, 1.38],
          type:"line"
        },


      ],
      chart: {
        height: 290,
        // width:320,
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
            text: "Annual Maintenance Cost (In Hundreds)"
          },
          // labels: {
          //   formatter: function (val) {
          //     return (val / 100).toFixed(2);
          //   }
          // }
        },

        {
          opposite: true,
          title: {
            text: "Total Cost Per Mile"
          }
        }
      ],

      tooltip: {
        y: [
          {
            // title: {
            //   formatter: function (val) {
            //     return val;
            //   }
            // }
          },
        ]
      },
      grid: {
        borderColor: "#f1f1f1"
      }
    };
  }

  // Chart for New TCO FLEET End //

  loadDsata() {
    this.getVin()
    this.getAllProvider()
    // this.getFleetSummaryData()
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
      //
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
      this.subscription$.add(
        this.userService.getFleetDetailTCO(obj).subscribe((res: any) => {
          this.VINsummary = res
          this.noofVehicles = res.numberOfVehicles
          if (this.VINsummary?.fuelCostInDollarPerGallon <= 0) {
            if (this.makeIdData == "" && this.modelIdData == "" && this.yearIdData == "") {
              this.openModelFleet()
            }
            else {
              if(this.makeIdData == null && this.modelIdData == null && this.yearIdData == null){
                this.openModelFleet()
              }
              else{
                this.openModel()
              }
            }

          }
          // this.getVINdata(this.VINsummary)
           this.getFuelCost(this.VINsummary)

        }, (err => {  }))
      )


    this.getFleetSummaryData()

  }

 async getFuelCost(data:any) {
  this.costData = data
  // this.gallonCost = data?.fuelCostInDollarPerGallon
  // this.mileagePerMile =this.hide ?  data?.mileagePerYearInMiles[this.currentYear] : data?.mileagePerYearInMiles[this.currentYear] / data?.numberOfVehicles
  // this.totalFuelConsumedData = this.hide ? data?.cxTotalFuelConsumedPerYear : data?.cxTotalFuelConsumedPerYear / data?.numberOfVehicles
  // this.totalFuelCost = this.hide ? (this.totalFuelConsumedData) * data?.fuelCostInDollarPerGallon : Number(((this.totalFuelConsumedData) * data?.fuelCostInDollarPerGallon))
  // this.annualFueldollarpermiles = this.totalFuelCost / this.mileagePerMile

  let chartDetail = this.tcoChartData
  let mileagePerYear: any = Object.values(data?.mileagePerYearInMiles).slice(0, 3)
  let totalmileageCost: any = Object.values(data?.mileagePerYearInMiles).slice(0, 3).map((item: any, index) => { return Number((item / mileagePerYear[index]).toFixed(2)) })

  let mileData = Object.values(data?.fuelCostInDollarPerYear).map((item: any) => { return Number(item.toFixed(2)) })
  let fuelCostperYear: any = Object.values(data?.fuelCostInDollarPerYear).slice(0, 3)
  let totalfuelCost = fuelCostperYear.map((item: any, index) => { return Number((item / mileagePerYear[index]).toFixed(2)) })
  // let totalDepreciationData = Object.values(this.costData?.yearlyDepreciationCostInDollarPerYear).slice(0, 3).map((item: any, index) => { return Number((item / mileagePerYear[index]).toFixed(2)) })
  this.tcoChartData.insuranceData = [this.costData?.annualInsurance, this.costData?.annualInsurance, this.costData?.annualInsurance]
  let totalInsuranceCost: any = mileagePerYear.map((item: any, index) => { return Number((this.costData?.annualInsurance / item).toFixed(2)) })
  this.tcoChartData.insuranceMileData = totalInsuranceCost
  let totalMaintanaceCost: any = mileagePerYear.map((item: any, index) => {
    return Number((this.costData?.maintenanceCostInDollarPerYear[this.currentYear + index] / item).toFixed(2)) })
  this.tcoChartData.stateData = [this.costData?.stateFee, this.costData?.stateFee, this.costData?.stateFee]
    let totalStateCost: any = mileagePerYear.map((item: any, index) => { return Number((this.costData?.stateFee / item).toFixed(2)) })
    this.tcoChartData.stateMileData = totalStateCost
    let annualData = this.tcoChartData.fuelData.map(function (item, i) {
      return Number((item + chartDetail.depreciationData[i] + chartDetail.maintenanceData[i] + chartDetail.insuranceData[i] + chartDetail.stateData[i]).toFixed(2));
    })
    let perMileCost = this.tcoChartData.fuelMileData.map(function (item, i) {
      return Number((item + chartDetail.depreciationMileData[i] + chartDetail.maintenanceMileData[i] + chartDetail.insuranceMileData[i] + chartDetail.stateMileData[i]).toFixed(2));
    })
    this.chartTcoForVIN();
  // await this.getDepreciationMaintanceCost(data)
  }

  chartProjection(mileData, annualData, categoriesData) {
    let seriesName: any;
    let seriesName1: any;
    let titleText: any;

    if (this.averageHide) {
      seriesName = "Average Cost per Mile ($)"
      seriesName1 = "Average Annual Cost ($)"
      titleText = "Average Annual Cost (* 1000)"
    } else if (this.hide) {
      seriesName = "Total Cost per Mile ($)"
      seriesName1 = "Total Annual Cost ($)"
      titleText = "Total Annual Cost (* 1000)"
    }
    this.chartOptions = {
      series: [
        {
          name: seriesName,
          data: mileData.map((item:any)=>{return Number(item.toFixed(2))})
        },
        {
          name: seriesName1,
          data: annualData.map((item:any)=>{return Number(item.toFixed(2))})
        },
      ],
      chart: {
        height: 440,
        stacked: false,
        zoom: {
          enabled: false
        },
        toolbar: { show: false },
        type: "line"
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 3,
        curve: "straight",
        dashArray: [0, 8, 5]
      },

      legend: {
        tooltipHoverFormatter: function (val, opts) {
          return (
            val
          );
        }
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        labels: {
          trim: true
        },
        categories: categoriesData
      },
      yaxis: [
        {
          title: {
            text: seriesName
          }
        },
        {
          // seriesName: seriesName,
          opposite: true,
          title: {
            text: titleText
          },
          labels: {
            formatter: function (val) {
              return val / 1000;
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

  getAllProvider() {
    this.subscription$.add(
      this.userService.getProviderListTCO(this.fleetId).subscribe((res: any) => {
        this.modelList = res.modelList
        this.yearList = res.modelYear
        this.provderList = res.providerList
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
    this.userService.getFleetSummaryTCO(obj).subscribe(data => {
      this.fleetSummary = data
    })
  }

  tcosearchPage() {
    this.yearIdData =null
    this.makeIdData =null
    this.modelIdData =null
    this.getAllData()
    //
  }

  redirect(){
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
    //
    this.btnstatus = false
    this.btnstatusByStatus = false
    this.subscription$.add(
      this.userService.getAllVehicles().subscribe(res => {
        this.vehicleData = res;
        this.vins = this.vehicleData.map(res => {
          return res.vin
        })
        setTimeout(() => {

        }, 4000)
      }, err => {

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
    // this.spinner.show
    this.subscription$.add(
      this.userService.vinDetails(oem).subscribe((res: any) => {
        this.getstellantisVin = res;

      }, err => {

      }))
  }

  submit(id) {
    this.detailsofTco = true;
    this.getstatus();
  }

  getstatus() {
    //
    this.subscription$.add(
      this.userService.vinDecode(this.oemVin).subscribe((res: any) => {

        let data = JSON.parse(res)
        this.profileVehicle = data.Results[0]
        this.getAllData()
      }, err => {

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

  totalCost() {
    this.hide = true
    this.averageHide = false;
    this.noofVehicles = this.hide ? 1 : this.costData?.numberOfVehicles
    this.chartTcoForVIN()
    this.getFuelCost(this.VINsummary)
    // this.getAllData()

  }

  averageCost() {
    this.hide = false
    this.averageHide = true;
    this.noofVehicles = this.hide ? 1 : this.costData?.numberOfVehicles
    this.chartTcoForVIN()
    this.getFuelCost(this.VINsummary)
    // this.getAllData()
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
    this.modalService.open(largeDataModal, { size: 'sx', centered: true });

    this.fleetIdData = this.fleetId
    this.compareFleet(this.fleetId)

  }

  compareFleet(evt: any) {
    let obj: any = {}
    obj.fleetId = evt
    if (evt) {
      //
      this.subscription$.add(
        this.userService.getFleetDetailTCO(obj).subscribe((res: any) => {
          //
          this.compareFleetData = res
        }, err => {
          //
        })
      )
    } else {
      this.compareFleetData = null
    }

  }

  getFLeetList() {
    //
    this.subscription$.add(
      this.userService.getAllFleets().subscribe((res: any) => {
        this.fleetList = res
        this.fleetList = this.fleetList.sort((a, b) => { return a.id - b.id })
        //
      }, err => {
        //
         })
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

  ngOnDestroy() {
    if (this.subscription$) {
      this.subscription$.unsubscribe()
    }
    if (this.sub) {
      this.sub.unsubscribe();
    }

  }

  viewYear(val:any) {
    this.chartIndex = val
    this.chartTcoForVIN()
  }

  chartTcoForVIN() {
    this.chartOptionsvin = {
      series: [1000, 1134, 1243, 1456, 1678],
      chart: {
        height:'330px',
        type: "donut",

      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      labels: ['Fuel Cost', 'Depreciation Cost', 'Maintenance Cost', 'Insurance Cost', 'State Fees'],
      colors: [ '#00c3b2', '#238eb0', '#e4863c','#ac4777', '#abec83'],
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 90,
          offsetY: 10
        }
      },
      tooltip: {
        custom: function (val, opt) {
        return val.w.config.labels[val.seriesIndex] + ' ' + ':' + ' ' + Number((val.w.globals.seriesPercent[val.seriesIndex][0]).toFixed(1)) + '%'
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

  selectVin(){
    this.selectVinOption = true;
    this.selectFleetOption = false
  }

  selectFleet(){
    this.selectVinOption = false;
    this.selectFleetOption = true;
  }

  comapreFleet(){
    this.router.navigate(['adlp/developer-corner/compare-tco'])
  }

  tcoCompareVinList(){
    this.userService.getCompareVinList().subscribe((res: any) => {
      this.tcoVinList = res?.vin
    }
    )
  }

}
