import { Component, OnInit } from '@angular/core';
import { FirestoreService } from '../servicios/FirestoreListas.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Location } from '@angular/common';
import { PostCuentasUseCase } from '../../../domain/Formularios/client/getFormulario';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent implements OnInit {

  //variables para almacenar los datos ingresados en los input del formulario del registro
  nombre_usuario: string = '';
  correo_usuario: string = '';
  contrasena_usuario: string = '';
  confirmar_contrasena: string = '';
  NPersonal_usuario: number = 0;

  //variable para guardar o recibir la imagen del formulario de registro
  file: File | any = null;

  //variable para comparar contraseñas
  comparar: boolean = false;
  Mensaje_Contrasena = false;
  Mostrar_Mensaje = false;
  Mostrar_Mensaje_Cuenta = false;
  mostrarBotonAceptar: boolean = false;

  //variable para almacenar la url obtenida de la imagen guardada en el storage de firabase
  imageURL: string | any;
  //variable para almacenar el objeto de la cuenta del usuario
  Cuenta: string[] | any;
  Mensaje_Cuenta: any;

  //location permite navegar entre las diferentes pestañas del sistema o manipular la pestaña actual
  //storage de AngularFireStorage permite acceder al storage de nuestro proyecto de firebase
  //PostCuentasUseCase es parte de nuestra arquitectura hexagonal, la cual permitirá comunicarnos con la api y realizar nuestras peticiones http(post, get, put, delete)
  constructor(
    private datosLocales: FirestoreService,
    private location: Location,
    private storage: AngularFireStorage,
    private _cuentaCrear: PostCuentasUseCase
  ) {}
 //función que permitirá crear el objeto de tipo cuenta
  async CrearCuenta() {
    //método para revisar la comparación de las dos contraseñas registradas en el formulario
    this.compararContraseña(this.contrasena_usuario, this.confirmar_contrasena);
    //implementación del método para guardar la imagen en el storage
    await this.SubirImagenFirestore();

    //guardar en variable cuenta los datos recopilados en el formulario
    this.Cuenta = [
      this.NPersonal_usuario,
      this.contrasena_usuario,
      this.correo_usuario,
      this.imageURL,
    ];

    //si las dos contraseñas son iguales, entonces ...
    if (this.comparar == true) {
      //realizar petición post para guardar la cuenta del docente
      this._cuentaCrear.postCuentas(this.Cuenta).subscribe(
        (response) => {
          this.Mensaje_Cuenta = "La cuenta ha sido creada con éxito";
          this.Mostrar_Mensaje_Cuenta = true;
          this.mostrarBotonAceptar = true;
        },
        (error) => {
          this.Mensaje_Cuenta = error.error;
          this.Mostrar_Mensaje_Cuenta = true;
          this.mostrarBotonAceptar = true;
        }
      );
      //Aquí se mostrará un mensaje indicando que la contraseña no es correcta o no coincidee, esto durante 4000 ms
    } else {
      this.Mensaje_Contrasena = true;
      setTimeout(() => {
        this.Mensaje_Contrasena = false;
      }, 4000);
    }
  }

  //La función permite ocultar el mensaje de que la cuenta ha sido creada con éxito
  ocultarMensajeCuenta(): void {
    this.Mostrar_Mensaje_Cuenta = false;
    this.mostrarBotonAceptar = false;
  }

  //Función para guardar la imagen del formulario en el storage de nuestro proyecto de firebase
  async SubirImagenFirestore() {
    //si la variable file no esta vacia(se almacenó una imagen en ella, entonces)
    if (this.file) {
      //la ruta o el  nombre con que se guardará en firebase será con el nombre de la imagen
      const filePath = `images/${this.file.name}`;
      //la referencia para firebase será la variable filePath
      const fileRef = this.storage.ref(filePath);
      try {
        //Subir la imagen guardada a firebase pasando como parametro la ruta o el path y el archivo a guardar
        await this.storage.upload(filePath, this.file);
        //Guardar en una variable el url de la imagen a través de la variable fileRef
        const downloadUrl = await fileRef.getDownloadURL().toPromise();
        //almacenar en  la variable que irá en al bd el url de la imagen obtenido
        this.imageURL = downloadUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  }


  //metodos para guardar los datos obtenidos o ingresados a traves del formulario de registro


  actualizarNombreUsuario(event: Event): void {
    //guardar en la variable lo que se registre o imgrese en el imput correspondiente del formulario
    this.nombre_usuario = (event.target as HTMLInputElement).value;
  }

  actualizarCorreo(event: Event): void {
    this.correo_usuario = (event.target as HTMLInputElement).value;
  }

  actualizarContrasena(event: Event): void {
    this.contrasena_usuario = (event.target as HTMLInputElement).value;
  }

  actualizarconfirmarContrasena(event: Event): void {
    this.confirmar_contrasena = (event.target as HTMLInputElement).value;
  }

  actualizarNumeroPersonal(event: Event): void {
    this.NPersonal_usuario = +(event.target as HTMLInputElement).value;
  }

  compararContraseña(contra1: string, contra2: string) {
    if (contra1 == contra2) {
      this.comparar = true;
    } else {
      this.comparar = false;
    }
  }

  GuardarImagen(event: any) {
    this.file = event.target.files[0];
    this.MostrarImagen(this.file);
  }

//método para mostrat la imagen, recibiendo como parametro un valor de tipo file
  MostrarImagen(file: File) {
    //Hacer una instancia de tipo FIleReader para poder mostrar o visualizar un archivo de tipo file
    const reader = new FileReader();
    //Utilizar el método onload para acceder a las características de la imagen 
    reader.onload = (e: any) => {
      this.imageURL = e.target.result;
    };
    //mostart imagen pasada como parámetro
    reader.readAsDataURL(file);
  }

  //Metodo para intercambiar formulario visible a la pantalla
  IniciarSesion() {
    //Guardar en caché qué formulario se queire visualizar(Login)
    this.datosLocales.Actualizar_Formulario('login');
    this.datosLocales.guardar_DatoLocal('formulario', 'login');
    this.location.go('/Sistema/Login');
    //Recargar página de destino+

    
    location.reload();
  }

  ngOnInit(): void {
    this.datosLocales.Actualizar_Login(false);
  }
}
