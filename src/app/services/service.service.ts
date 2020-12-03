import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ServiceService {


  constructor(
    protected http: HttpClient) {
  }
  tablas() {
    return this.http.get(`${environment.URL_BASE}/UploadExcel/tablas`);
  }
  columns(tipo) {
    return this.http.get(`${environment.URL_BASE}/UploadExcel/columnas/${tipo}`);
  }
  uploadExcel(data, params) {
    let optionsHttp = {params: params};
    return this.http.post(`${environment.URL_BASE}/UploadExcel/photos/upload`, data, optionsHttp);
  }
}
