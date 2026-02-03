import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filters'
})
export class FiltersPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;

    return items.filter(item => {
      return Object.keys(item).some(key => {
        return String(item[key]).toLowerCase().includes(searchText.toLowerCase());
      });
    });
   }
}

@Pipe({
  name: 'filterEmptyValues'
})
export class FilterEmptyValuesPipe implements PipeTransform {
  transform(values: any[]): any[] {
    if (!Array.isArray(values)) {
      return values;
    }
    return values.filter(value => value !== null && value !== '' && value !== undefined);
  }
}

@Pipe({
  name: 'filterByVin'
})
export class FilterByVinPipe implements PipeTransform {
  transform(vehicles: any[], search: string): any[] {
    if (!vehicles) return [];
    if (!search || search.trim() === '') return vehicles;

    search = search.toLowerCase();
    return vehicles.filter(v =>
      v?.vin?.toLowerCase().includes(search) ||
      v?.alias?.toLowerCase().includes(search)
    );
  }
}
