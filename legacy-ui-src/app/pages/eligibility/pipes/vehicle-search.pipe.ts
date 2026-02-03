import { Pipe, PipeTransform } from '@angular/core';

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

@Pipe({
  name: 'searchbyId'
})
export class SearchIdPipe implements PipeTransform {
  transform(items: any, searchId: string): any[] {
    if(!items) return [];
    if(!searchId) return items;

    searchId = searchId.toLowerCase();

    return items.filter( item => {
      return item.id.toLowerCase().includes(searchId) || item.providerName.toLowerCase().includes(searchId);
    });
  }

}

@Pipe({
  name: 'activeOnly'
})
export class ActiveOnlyPipe implements PipeTransform {
  transform(items: any, search: string): any[] {
    if(!items) return [];
    if(!search) return items;
    search = search.toLowerCase();
    return items.filter( item => {
      return item.vin.toLowerCase().includes(search);
    });
  }

}

@Pipe({
  name: 'filterConsumer'
})
export class FilterConsumerPipe implements PipeTransform {
  transform(items: any, consumer: string): any[] {
    if(!items) return [];
    if(!consumer) return items;
    // consumer = consumer.toLowerCase();
    return items.filter( item => {
      return item.consumerName = consumer;
    });
  }

}
@Pipe({
  name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}



@Pipe({
  name: 'oemSearch'
})
export class OemSearchPipe implements PipeTransform {

  transform(value:any, searchByOem:string){
    if(!value)return null;
      if(!searchByOem)return value;
      searchByOem = searchByOem.toLowerCase()
      return value.filter(function(search){
        return JSON.stringify(search.providerName).toLowerCase().includes(searchByOem);
    });
  }

}


@Pipe({
  name: 'consumerSearch'
})
export class ConsumerSearchPipe implements PipeTransform {

  transform(value:any, searchByConsumer:string){
    if(!value)return null;
      if(!searchByConsumer)return value;
      searchByConsumer = searchByConsumer.toLowerCase()
      return value.filter(function(search){
        console.log(search);

        return JSON.stringify(search.consumer).toLowerCase().includes(searchByConsumer);
    });
  }


}
