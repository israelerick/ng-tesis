import { DataSource } from '@angular/cdk/table';
import { OnInit, Component, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Excel from "exceljs/dist/exceljs.min.js";
import { ServiceService } from './services/service.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import * as moment from 'moment';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ServiceService]
})
export class AppComponent implements OnInit {
  @ViewChild('stepper') _stepper;
  @ViewChild("fileUpload", {static: false}) fileUpload: ElementRef;
  arr_columnas = [];
  arr_hoja = [];
  file = null;
  tabla_cbx = new FormControl();
  sheets = new FormControl(null);
  rows = new FormControl(1);
  displayedColumns: string[] = [ 'a', 'b'];
  columnXls = ['a', 'b', 'c'];// esto debo sacar del excel
  auxColumn = {};
  dataTable: any = [
    {id: 1, nombre: 'NIT', tipo_dato: 'INT'},
    {id: 2, nombre: 'NOMBRE_PROVEEDOR', tipo_dato: 'VARCHAR'},
    {id: 3, nombre: 'NUMERO_AUTORIZACION', tipo_dato: 'INT'}
  ];
  dataSource = [];
  
  tablas: any = [];
  constructor(
    private _service: ServiceService,
    private _snackBar: MatSnackBar
  ) {

  }
  ngOnInit() {
    this.readTable();
  }
  data() {
    this.displayedColumns = ['campo', 'name', 'weight', 'symbol'];
  }
  readTable() {
    this._service.tablas().subscribe(response => {
      this.tablas = response;
    },
    error => {
      
    });
  }
  readColumn() {
    this._service.columns(this.tabla_cbx.value).subscribe(response => {
      this.dataTable = response;
    },
    error => {
      
    });
  }
  
  async loadFile() {
    
    if (this.file == null) {
      this.openSnackBar('Seleccione el archivo');
      return;
    }
    if (this.sheets.value == null) {
      this.openSnackBar('Seleccione la hoja del Excel');
      return;
    }
    if (this.rows.value <= 0) {
      this.openSnackBar('Seleccione desde que linea se realizara la lectura de datos');
      return;
    }

    if (this.tabla_cbx.value==null) {
      this.openSnackBar('Seleccione el tipo de transacción');
      return;
    }
    
    
    
    let workbook = new Excel.Workbook();
    await workbook.xlsx.load(this.file);
    console.log('worksheet=',this.sheets.value);
    let worksheet = workbook.getWorksheet(this.sheets.value);
    let nuevas = [];
    console.log('worksheet======',worksheet.actualColumnCount);
    for (let i = 0; i < worksheet.actualColumnCount; i++) {
      nuevas.push(String.fromCharCode(65 + i));
    }
    this.columnXls = nuevas;
    this.displayedColumns = nuevas;
    /*
    setTimeout(function(that, arr){ 
      that.columnXls = arr;
      that.displayedColumns = arr;
    }, 3000, this, nuevas);
    */
   
    let that = this;
    let arr = [], index = 0

    await worksheet.eachRow((row, rowIndex) => {
      if (rowIndex>(parseInt(this.rows.value))) {
        if (rowIndex<5+(parseInt(this.rows.value))) {
          let obj = {}
          for(let j=0; j < that.displayedColumns.length; j++) {
            //obj[that.displayedColumns[j]] = row.getCell(that.displayedColumns[j]).value;
            obj[that.displayedColumns[j]] = row.getCell(that.displayedColumns[j]).text;
          }
          arr.push(obj);
        }
      }
      
      

    });
    this.dataSource = arr;
    setTimeout(function(that, arr){ 
      that.cargar(arr);
    }, 3000, this, arr);
    this._stepper.next();
  }
  cargar(arr) {
    this.dataSource = arr;
  }
  onClick() {
    console.log(this.tabla_cbx.value);
    const fileUpload = this.fileUpload.nativeElement;
    fileUpload.onchange = async () => {

      this.file = fileUpload.files[0];
      console.log('file=', this.file);
      console.log('name file=', this.file.name);
      let workbook = new Excel.Workbook();
      await workbook.xlsx.load(this.file);
      this.arr_hoja = workbook.worksheets;
      console.log('work',workbook.worksheets);
    

    };

    fileUpload.click();
  
  }
  uploadExcel() {
    if (this.arr_columnas.length==0) {
      this.openSnackBar('Falta seleccionar el nombre de los campos');
      return;
    }
    console.log('-------------------');
    let formData = new FormData();
    formData.append('files', this.file, this.file.name);
    //formData.append('tipotabla', this.tabla_cbx.value);

    this._service.uploadExcel(formData, 
      {
        tipotabla: this.tabla_cbx.value,
        nroHoja: this.sheets.value,
        nrofila: parseInt(this.rows.value),
        orden_columnas: JSON.stringify(this.arr_columnas)
      }
      ).subscribe(response => {
      console.log(response);
    },
    error => {
      console.log(error);
    });
  }
  selectColumna(id, campo) {
    let i = 0
    while(i < this.arr_columnas.length && this.arr_columnas[i].campo!==campo) {
      i++;
    } 
    if (i < this.arr_columnas.length) {
      this.arr_columnas[i].id = id;
      this.arr_columnas[i].campo = campo;
    } else {
      this.arr_columnas.push({id: id, campo: campo});
    }
    i=0;
    while(i < this.dataTable.length && this.dataTable[i].id!=id) {
      i++;
    }
    console.log(this.dataSource);

    for (let j = 0; j < this.dataSource.length; j++) {
      let reg = null
      switch(this.dataTable[i].tipo_dato) {
        case 'INT':
          reg = /^[0-9]{1,15}$/
          console.log(reg.test(this.dataSource[j][campo]) );
          if(!reg.test(this.dataSource[j][campo])) {
            this.openSnackBar(`El campo '${campo}' no es de tipo '${this.dataTable[i].tipo_dato}'`);
          }
        break;
        case 'FLOAT':
          reg = /[+-]?([0-9]*[.])?[0-9]+/
          console.log(reg.test(this.dataSource[j][campo]) );
          if(!reg.test(this.dataSource[j][campo])) {
            this.openSnackBar(`El campo '${campo}' no es de tipo '${this.dataTable[i].tipo_dato}'`);
          }
        break;  
        case 'DATE':
          try {
            let now = moment(this.dataSource[j][campo]);
            console.log(now.format());   
            if (now.format()=='Invalid date') {
              this.openSnackBar(`El campo '${campo}' no es de tipo '${this.dataTable[i].tipo_dato}'`);  
            }

          } catch(e) {
            this.openSnackBar(`El campo '${campo}' no es de tipo '${this.dataTable[i].tipo_dato}'`);
          }
          
        break;
      }

      //this.dataTable[i].tipo_dato
    }

  }
  openSnackBar(message: string) {
    this._snackBar.open(message, 'Información', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}