import { Inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class FirestoreService {

  //Variable de tipo subject cuyo fin es referenciar si el usuario ha iniciado sesión o no, dentro del sistema
  private loggedInSubject = new Subject<any>();
  //Variable cuyo fin es almacenar los cambios efectuados en la variable loggedInSubject, la cual se convirtió en un observable para permitirle
  //cambiar su valor de forma dinámica y monitorear su cambio
  loggedIn$ = this.loggedInSubject.asObservable();

  //variable de tipo subject cuyo fin es referenciar de qué docente se mostrará la información en el sistema
  private docenteSubject = new Subject<any>();
  //Variable cuyo fin es almacenar los cambios efectuados en la variable docenteSubject, la cual se convirtió en un observable para permitirle
  //cambiar su valor de forma dinámica y monitorear su cambio
  docente$ = this.docenteSubject.asObservable();

  //Variable de tipo subject cuyo fin es saber que formulario(registro o inicio de sesión) se mostrará al ususario
  //Se implementó esta variable para forzar al sistema a solo mostrar los formularios del login si no se inicia sesión, asegurándose de que no se
  //muestren los demás componentes hasta que se inicie sesión
  private formularioSubject = new Subject<any>();
  //Variable cuyo fin es almacenar los cambios efectuados en la variable formularioSubject, la cual se convirtió en un observable para permitirle
  //cambiar su valor de forma dinámica y monitorear su cambio
  formulario$ = this.formularioSubject.asObservable();

  constructor(
    private firestore: AngularFirestore
  ) { }

  //función para obtener un dato almacenado en el caché del navegador
  obtener_DatoLocal(indice: string): any {
    //sintaxis perteneciente al caché del navegador
    return localStorage.getItem(indice);
  }

  //función para guardar un dato que estará referenciado con su índice(con el cual se accederá a través de obtener dato local) en el caché del navegador
  guardar_DatoLocal(indice: string, valor: any): void {
    //sintaxis perteneciente al caché del navegador
    localStorage.setItem(indice, valor);
    console.log("guardado", indice, valor);
  }

//funcion para eliminar un dato a través de su índice
  eliminar_DatoLocal(indice: string): void {
    localStorage.removeItem(indice);
  }

  //Función para avisar al sistema del estado de inicio de sesión, por ejemplo, si es true quiere decir que ha iniciado sesión con exito, caso contrario seguirá siendo false, negando que el usuario avance a los siguientes componentes
  Actualizar_Login(loggedIn: boolean) {
    this.loggedInSubject.next(loggedIn);
  }

  //Función para avisar al sistema sobre el número de personal del docente que ha iniciado sesión en el sistema
  Actualizar_Docente(docente: string | number) {
    this.docenteSubject.next(docente);
  }

//Funcion para avisar al sistema qué formulario de login(registro o inicio de sesión) se mostrará al usuario
  Actualizar_Formulario(formulario: string | any) {
    this.formularioSubject.next(formulario);
  }

  //Funcion para almacenar un arreglo de valores con un único indice
  guardar_ArregloLocal(indice: string, valor: any): void {
    const arreglo_Local = JSON.parse(this.obtener_DatoLocal(indice)) || [];
    arreglo_Local.push(valor);
    this.guardar_DatoLocal(indice, JSON.stringify(arreglo_Local));
  }


  //eliminar caché en el navegador
  eliminarCacheNavegador() {
    if (caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (key) {
          caches.delete(key);
        });
      });
    }

    localStorage.clear();

    sessionStorage.clear();
  }

  guardar_ArregloLocal2(indice: string, valor: any[]): void {
    const arregloLocal = JSON.parse(this.obtener_DatoLocal(indice)) || [];
    arregloLocal.push(...valor); // Utiliza el operador spread para agregar los elementos al arreglo existente
    this.guardar_DatoLocal(indice, JSON.stringify(arregloLocal));
  }
}
