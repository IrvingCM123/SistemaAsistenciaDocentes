import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FirestoreService } from './Views/UI/servicios/FirestoreListas.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  //variable que almacenará si el usuario ha iniciado sesión o no
  loggedIn: boolean = false;
  //variable que almacenará que formulario mostrar
  formulario: string = '';

  //constructor donde se permite la instanciación del servicio para almacenar datos en caché o actualizar las funciones necesarias para el funcionamiento del sistema (FirestoreService)
  //La biblioteca Router permite navegar entre las paginas(componentes) del sistema
  constructor(private router: Router, private datosLocales: FirestoreService) {

    //Evento que permite cambiar el formulario que se mostrará al usuario, recibiendo como parametro la activacion de un evento
    this.router.events.subscribe((event) => {
      //si el evento es de tipo cambiar contendio de pagina entonces...
      if (event instanceof NavigationEnd) {
        //cambiar la ruta de la pagina para mostrar el formulario deseado
        const path = event.urlAfterRedirects.split('/')[1];
        //si la ruta de la pagina lleva la palabra registro entonces...
        if (path === 'Registro') {
          //se muestra el formulario de registro
          this.formulario = 'registro';
          //en caso contrario ...
        } else if (path === 'Login') {
          //se muestra el formulario login
          this.formulario = 'login';
        }
      }
    });
  }
  //Nota: El evento anterior no está dentro de ningun método o función, ni siquiera dentro de ngOnInit, esto le permitirá ejecutarse siempre que se detecteun cambio en el sistema, forzando al sistema a solo mostrar esos componentes y no los demás

  //mastrar formulario login
  mostrarIniciarSesion(): void {
    this.formulario = 'login';
  }
  //mostrar formulario registro
  mostrarRegistro(): void {
    this.formulario = 'registro';
  }

  //
  async ngOnInit() {
    //mismo evento de arriba, solo que lo carga al inicio del componente para asegurar que no se muestren los demás componentes si no se inicia sesión
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const path = event.urlAfterRedirects.split('/')[1];
        if (path === 'Registro') {
          this.formulario = 'registro';
        } else if (path === 'Login') {
          this.formulario = 'login';
        }
      }
    });

    //Guarda en una constante si el usuario ha iniciado sesión o no, obteniendo esta información del caché del navegador
    //Esta implementación se llevó a cabo debido a que si el usuario cierra la pestaña del navegador, mas no borró el caché, le permitirá ingresar alsistema sin volver a iniciar sesión
    const cachedLoggedIn = await this.datosLocales.obtener_DatoLocal('login');
    if (cachedLoggedIn) {
      this.loggedIn = cachedLoggedIn;
    }

    //Guarda en una constante el formulario a mostrar, obteniendo esta información del caché del navegador
    const cachedFormulario = await this.datosLocales.obtener_DatoLocal('formulario');
    if (cachedFormulario) {
      this.formulario = cachedFormulario;
    }

    //actualiza el valor de la variable loggedIn del servicio para saber si el usuario ha iniciado sesión o no
    this.datosLocales.loggedIn$.subscribe(loggedIn => {
      this.loggedIn = loggedIn;
    });
    //actualiza el valor de la variable formulario del servicio para saber que formulario se va mostrar
    this.datosLocales.formulario$.subscribe(formulario => {
      this.formulario = formulario;
    });
  }
}
