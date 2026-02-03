import { Pipe, PipeTransform } from '@angular/core';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Pipe({
  name: 'searchProvider'
})
export class SearchproviderPipe implements PipeTransform {

  transform(value:any, searchProviderText:string){
    if(!value)return null;
      if(!searchProviderText)return value;
      searchProviderText = searchProviderText.toLowerCase()
      return value.filter(function(search){
        return JSON.stringify(search.parameterName).toLowerCase().includes(searchProviderText);
    });
  }

}


@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {
  transform(array: any[], field: string, ascending: boolean = true): any[] {
    if (!array || array.length === 0) return array;

    return array.sort((a, b) => {
      const aValue = new Date(a[field]).getTime(); // Convert to timestamp for date comparison
      const bValue = new Date(b[field]).getTime();

      return ascending ? bValue - aValue : aValue - bValue;
    });
  }
}


@Pipe({
  name: 'indianNumberFormat'
})
export class IndianNumberFormatPipe implements PipeTransform {

  transform(value: number): string {
    if (!isFinite(value)) {
      return value.toString();
    }

    let parts = value.toFixed(2).split('.');
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    let lastThreeDigits = integerPart.slice(-3);
    let otherDigits = integerPart.slice(0, -3);

    if (otherDigits) {
      lastThreeDigits = ',' + lastThreeDigits;
    }

    return otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThreeDigits + decimalPart;
  }
}



@Pipe({
  name: 'statusSearch'
})
export class StatusSearchPipe implements PipeTransform {

  transform(value:any, searchByStatus:string){
    if(!value)return null;
      if(!searchByStatus)return value;
      searchByStatus = searchByStatus.toLowerCase()
      return value.filter(function(search){
        return search.status.toLowerCase() == searchByStatus.toLowerCase()
    });
  }

}

@Pipe({
  name: 'searchbar'
})
export class SearchbarPipe implements PipeTransform {
 transform(items: any, searchText: string): any[] {
    if(!items) return [];
    if(!searchText) return items;

    searchText = searchText.toLowerCase();
  // console.log(searchText, items)
    return items.filter( item => {
      // console.log(item, 'sajal')
      return item.modelName.toLowerCase().includes(searchText);
    });
  }


}


@Pipe({
  name: 'zpexchartpipe'
})
export class ZpexchartpipePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    let sortData:any=[];
    value.map((res)=>{
      sortData.push({data:res.data.slice(0,10)})
   })
    return sortData;
  }
}

@Pipe({
  name: 'searchFeatures'
})
export class SearchvinPipe implements PipeTransform {
  transform(items: any, searchFeatures: string): any[] {
    if(!items) return [];
    if(!searchFeatures) return items;
    searchFeatures = searchFeatures.toLowerCase();
    return items.filter( item => {
      item.column = String( item.column )
      return item.column.includes(searchFeatures)
    });
  }

}

@Pipe({
  name: 'searchFleets'
})
export class SearchSummary implements PipeTransform {
  transform(items: any, searchFleets: string): any[] {
    if(!items) return [];
    if(!searchFleets) return items;
    searchFleets = searchFleets.toLowerCase();
    return items.filter( item => {
      item.fleetId = String( item.fleetId )
      return item.fleetId.includes(searchFleets) || item.fleetName.toLowerCase().includes(searchFleets) ;
    });
  }
}

@Pipe({
  name: 'searchbyId'
})
export class SearchIdPipe implements PipeTransform {
  transform(items: any, searchId: string): any[] {
    if(!items) return [];
    if(!searchId) return items;

    searchId = searchId.toLowerCase();
    return items.filter( item => {
      return item.id.toLowerCase().includes(searchId) || item.name.toLowerCase().includes(searchId);
    });
  }

}

@Pipe({
  name: 'topPredicted'
})
export class TopPredictedPipe implements PipeTransform {
  transform(data: any[], top: boolean): any[] {
    const sortedData = data.sort((a, b) => {
      return top ? b.predicted_score - a.predicted_score : a.predicted_score - b.predicted_score;
    });

    return sortedData.slice(0, 5);
  }
}

@Pipe({
  name: 'bottomPredicted'
})
export class BottomPredictedPipe implements PipeTransform {
  transform(data: any[]): any[] {
    return data.slice(-5).reverse();
  }
}

@Pipe({
  name: 'vehicleSearch'
})
export class VehicleSearchPipe implements PipeTransform {

  transform(value:any, searchByVin:string){
    if(!value)return null;
      if(!searchByVin)return value;
      searchByVin = searchByVin.toLowerCase()
      return value.filter(function(search){
        return JSON.stringify(search.vin).toLowerCase().includes(searchByVin);
    });
  }

}



@Injectable({
  providedIn: 'root'
})
export class FleetService {
  private fleetIdSource = new BehaviorSubject<any>(null);
  currentFleetId = this.fleetIdSource.asObservable();

  changeFleetId(fleetId: any) {
    this.fleetIdSource.next(fleetId);
  }

}

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;

    searchText = searchText.toLowerCase();
    return items.filter(item => {
      const vin = item.alias?.toLowerCase() || '';
      const alias = item.alias?.toLowerCase() || '';
      return vin.includes(searchText) || alias.includes(searchText);
    });
  }
}

@Pipe({
  name: 'filterByVin'
})
export class FilterByVinPipe implements PipeTransform {
  transform(vehicles: any[], searchByVin: string): any[] {
    if (!searchByVin) return vehicles;
    return vehicles.filter(vehicle =>
      vehicle?.alias?.toLowerCase().includes(searchByVin.toLowerCase()));
  }
}


@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items || !searchText) {
      return items;
    }
    return items.filter(item =>
      item.geofence_name.toLowerCase().includes(searchText.toLowerCase())
    );
  }
}
