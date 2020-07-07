declare var require: any;

import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import * as Highcharts from 'highcharts';
import MapModule from 'highcharts/modules/map';
import More from 'highcharts/highcharts-more';

const World = require('@highcharts/map-collection/custom/world.geo.json');
const ecoData = require('./eco_footprint.json');
MapModule(Highcharts);
More(Highcharts);
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild("info", { read: ElementRef, static: false }) container: ElementRef;
  @ViewChild("Bioinfo", { read: ElementRef, static: false }) bioContainer: ElementRef;
  title = 'EcoVisualizer';
  Highcharts = Highcharts;
  chartConstructor = "mapChart";
  countryChartConstructor = "chart";
  mapChart;
  countryDetailsChart;
  mapChartCallback;
  countryDetailsCallback;
  updateFromInput = false;
  updateCountryDetails = false;
  data: any = [];
  selectedCountry = "";
  selectedCountryData = [];
  selectedCountryObj;
  mapChartOptions = {
    chart: {
      map: World
    },
    title: {
      text: 'Global Ecological Footprint per Country, 2016'
    },
    subtitle:{
      text: 'Data is Measured in Global Hectares'
    },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        alignTo: 'spacingBox'
      }
    },
    legend: {
      title: {
        text: 'Biocapacity Deficit or Reserve',
        style: {
          color: 'black'
        }
      },
      align: 'left',
      verticalAlign: 'bottom',
      floating: true,
      layout: 'vertical',
      valueDecimals: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      symbolRadius: 0,
      symbolHeight: 14
    },
    colorAxis: {
      dataClasses: [{
        to: -3
      }, {
        from: -3,
        to: 0
      }, {
        from: 0,
        to: 3
      }, {
        from: 3,
        to: 10
      }, {
        from: 10,
      }],
      minColor: '#bd1816',
      maxColor: '#007000'
    },
    series: [{
      name: 'Biocapacity Deficit or Reserve',
      states: {
        hover: {
          color: '#69DD43'
        },
        select: {
          color: '#69DD43',
          borderColor: 'white',
          dashStyle: 'shortdot'
        }
      },
      dataLabels: {
        enabled: true,
        format: '{point.name}'
      },
      allAreas: false,
      data: this.data,
      joinBy: ['iso-a3', 'code'],
      animation: true,

      shadow: false,
      allowPointSelect: true,
      point: {
        events: {
          select: () => { //Arrow function required to bind to chart component instead of the sub-object
            this.selectCountry();
          },
          unselect: () => {
            this.selectCountry();
          }
        }
      }
    }]
  }

  countryDetailsOptions: Highcharts.Options = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: 'Ecological Footprint by Productive Category, 2016'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',

        dataLabels: {
          enabled: false
        },

        showInLegend: true
      }
    },
    series: [{
      type: 'pie',
      name: 'Ecological footprint percentage',
      data: this.selectedCountryData
    }]
  };
  countryBioDetailsOptions: Highcharts.Options = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: 'Biocapacity by Category, 2016'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',

        dataLabels: {
          enabled: false
        },

        showInLegend: true
      }
    },
    series: [{
      type: 'pie',
      name: 'Ecological biocapacity percentage',
      data: this.selectedCountryData
    }]
  };
  constructor(private cdRef: ChangeDetectorRef
  ) {
    const self = this;
    this.mapChartCallback = chart => {
      self.mapChart = chart;
      this.updateCountryInformation()
    };

    this.countryDetailsCallback = chart => {
      self.countryDetailsChart = chart;
      this.updateSelectedCountry();
    };
  }

  ngOnInit() {
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  selectCountry() {
    let countries = this.mapChart.getSelectedPoints();
    console.log(countries);
    if (countries.length > 0) {
      this.selectedCountry = countries[0].code;
      this.updateSelectedCountry();
    } else {
      this.selectedCountry = "";
    }
  }


  updateCountryInformation() {
    this.mapChart.showLoading();
    this.data.splice(0, this.data.length);
    ecoData.forEach((element: any) => {
      this.data.push({
        code: element.CountryCode.toUpperCase(),
        value: element["Biocapacity Deficit or Reserve"],
        name: element["Country"]
      });
    });
    this.mapChart.hideLoading();
    this.updateFromInput = true;
  }

  updateSelectedCountry() {
    if (this.selectedCountry !== "") {
      let countryData: any = this.getCountryEmissionsData();
      this.selectedCountryData.splice(0, this.selectedCountryData.length);
      this.selectedCountryData.push(...countryData);
      this.countryDetailsOptions.subtitle = {text:this.selectedCountryObj.Country + ', Total Ecological Footprint: ' + this.selectedCountryObj["Total Ecological Footprint"]};
      Highcharts.chart(this.container.nativeElement, this.countryDetailsOptions);
      countryData = this.getCountryBiocapacityData();
      this.selectedCountryData.splice(0, this.selectedCountryData.length);
      this.selectedCountryData.push(...countryData);
      this.countryBioDetailsOptions.subtitle = {text:this.selectedCountryObj.Country  + ', Total Biocapacity: ' + this.selectedCountryObj["Total Biocapacity"]};
      Highcharts.chart(this.bioContainer.nativeElement, this.countryBioDetailsOptions);
    }
  }

  //Helper functions

  getCountryEmissionsData() {
    let i = 0;  
    while (i < ecoData.length) {
      if (ecoData[i].CountryCode.toUpperCase() === this.selectedCountry.toLocaleUpperCase()) {
        this.selectedCountryObj = ecoData[i];
      }
      i++;
    }
    return [{ name: "Cropland Footprint", y: parseFloat(this.selectedCountryObj["Cropland Footprint"]) },
    { name: "Grazing Footprint", y: parseFloat(this.selectedCountryObj["Grazing Footprint"]) },
    { name: "Forest Footprint", y: parseFloat(this.selectedCountryObj["Forest Footprint"]) },
    { name: "Carbon Footprint", y: parseFloat(this.selectedCountryObj["Carbon Footprint"]) },
    { name: "Fish Footprint", y: parseFloat(this.selectedCountryObj["Fish Footprint"]) }];
  }

  getCountryBiocapacityData() {
    let i = 0;  
    while (i < ecoData.length) {
      if (ecoData[i].CountryCode.toUpperCase() === this.selectedCountry.toLocaleUpperCase()) {
        this.selectedCountryObj = ecoData[i];
      }
      i++;
    }
    return [{ name: "Cropland", y: parseFloat(this.selectedCountryObj["Cropland"]) },
    { name: "Grazing Land", y: parseFloat(this.selectedCountryObj["Grazing Land"]) },
    { name: "Forest Land", y: parseFloat(this.selectedCountryObj["Forest Land"]) },
    { name: "Fishing Water", y: parseFloat(this.selectedCountryObj["Fishing Water"]) },
    { name: "Urban Land", y: parseFloat(this.selectedCountryObj["Urban Land"]) }];
  }
}
