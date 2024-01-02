import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GetMateriaUseCase } from 'src/app/domain/Materia/usecase/client/getMateria';
import { DatosService } from './Datos.Service';
import { FirestoreService } from '../servicios/FirestoreListas.service';
import { GetListaAsistenciaUseCase } from 'src/app/domain/ListaAsistencia/usecase/getLista';
import { PostTokenUseCase } from 'src/app/domain/Tokens/usecase/postTokens';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
})
export class InicioComponent implements OnInit {
  constructor(
    private _getMateriasCasosUso: GetMateriaUseCase,
    private _generarToken: PostTokenUseCase,
    private _getCantidadLista: GetListaAsistenciaUseCase,
    private servicedatos: DatosService,
    private datosLocales: FirestoreService
  ) {}

  public nrc$: any;
  //variable de tipo array para el almacenamiento de la información de cada materia del docente
  public Materias: Array<any> = [];
  public cantidad_alumnos: any[] = [];

  public materias$: any;
  public Token: string | any;
  public TokenNrc: string | any;

  public datos: any;
  public dato: number = 0;

  async ngOnInit() {
    //Se guarda en una nueva variable el token que está almacenado en el caché del navegador
    this.Token = this.datosLocales.obtener_DatoLocal('Resp');
    //Obtener NRC del docente mandando su token
    await this.obtener_nrcMaterias(this.Token);
    //Generar nuevo token con el array de NRC
    await this.generarToken(this.nrc$.nrcs);
  
    await this.obtener_Materias(this.TokenNrc.token);
  }

  //Este metodo generará un nuevo token cuyo contenido será el array de los NRC obtenidos en la peticion obtener_nrcMaterias
  //Esto con el fin de proteger los datos en el trafico de peticiones
  //Su controlador en la api es generarToken, ahí se guardará el valor mandado aquí junto a una contraseña definida
  async generarToken(valor: string | any) {
    //Almacenar en una nueva variable el token obtenido de la api
    this.TokenNrc = await new Promise((resolve, reject) => {
      this._generarToken.postTokens(valor).subscribe(
        (Resp: any) => {
          resolve(Resp);
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  //obtener la cantidad de estudiantes resgistrados en una materia
  async obtener_cantidadEstudiantes() {
    //obtener el nrc de la materia de cada objeto del array a través de su campo materia.nrc con ayuda de la funcion map
    let nrc: string[] | any = await this.Materias.map(
      (materia: any) => materia.nrc
    );
    //obtener la licenciatura de la materia de cada objeto del array a través de su campo materia.licenciatura con ayuda de la funcion map
    let carrera: string[] | any = await this.Materias.map(
      (materia: any) => materia.licenciatura
    );

    //se itera las mismas veces que el tamaño del arreglo de nrc/carrera
    for (let a = 0; a <= nrc.length - 1; a++) {
      //guardar en una nueva variable de tipo array la cantidad de alumnos obtenida de su consulta con el metodo establecido
      this.cantidad_alumnos[a] =
        //se obtiene la cantidad de alumnos registrados utilizando el siguiente método, pasando como
        // parametro el nrc y la carrera con su posisión correspondiente(a)
        await this._getCantidadLista.getCantidadListaAsistencia(
          nrc[a],
          carrera[a]
        );
    }
  }
  //Este método manda una petición a la api para obtener los NRC(solo el nrc) que corresponda a este docente
  //Se mandará el token , este contendrá el numero de personal del docente
  //El metodo del controlador de la api correspondiente es DocentesMateria
  async obtener_nrcMaterias(Token: string) {
    if (this.datosLocales.obtener_DatoLocal('MateriasDocenteArray') != null) {
      console.log('datos obtenidos de caché');

      let materiasDocente: any = this.datosLocales.obtener_DatoLocal(
        'MateriasDocenteArray'
      );

      // Convertir el string a un arreglo, para poder filtrar los nrc que tienen la siguiente estructura
      materiasDocente = materiasDocente.split(',');

      // Quitar los corchetes del inicio y del final [ ]
      materiasDocente[0] = materiasDocente[0].replace('[[', '');
      materiasDocente[materiasDocente.length - 1] = materiasDocente[
        materiasDocente.length - 1
      ].replace(']]', '');

      // Convertir el arreglo a un arreglo de números
      materiasDocente = materiasDocente.map((nrc: any) => parseInt(nrc));
      this.nrc$ = materiasDocente;
      return (this.nrc$ = { nrcs: materiasDocente });
    } else {
      this.nrc$ = await new Promise((resolve, reject) => {
        this._getMateriasCasosUso.getNRCMaterias(Token).subscribe(
          (Resp: any) => {
            resolve(Resp);
          },
          (error: any) => {
            reject(error);
          }
        );
      });
      this.datosLocales.guardar_ArregloLocal(
        'MateriasDocenteArray',
        this.nrc$.nrcs
      );
      return this.nrc$;
    }
  }

  //Este metodo recibirá un token cuyo valor será el array de NRC y devolverá la informacion necesaria de cada nrc
  async obtener_Materias(materia: any) {
    if (this.datosLocales.obtener_DatoLocal('MateriaInformacion') != null) {
      let obtener = this.datosLocales.obtener_DatoLocal('MateriaInformacion');
      obtener = obtener.split('},');
      // Quitar los corchetes del inicio y del final [ ]
      obtener[0] = obtener[0].replace('[[', '');
      obtener[obtener.length - 1] = obtener[obtener.length - 1].replace(
        ']]',
        ''
      );

      //Iterar objeto por objeto y agregar un } al final de cada objeto
      for (let i = 0; i < obtener.length; i++) {
        obtener[i] = obtener[i] + '}';
      }

      //Iterar objeto por objeto y quitar los "" de cada objeto al inicio y al final
      for (let i = 0; i < obtener.length; i++) {
        obtener[i] = obtener[i].replace('"', '');
        obtener[i] = obtener[i].replace('"', '');
      }

      //Iterar todo el array y convertir posicion por posicion a un array de objetos
      for (let i = 0; i < obtener.length; i++) {
        //Convertir mi string a un array de objetos sin ocupar JSON.parse
        let arreglo = obtener[i].split(',"');

        arreglo = arreglo.map((elemento: any) => {
          elemento = elemento.replace('"', '');
          elemento = elemento.replace('"', '');
          return elemento;
        });

        arreglo = arreglo.map((elemento: any) => {
          elemento = elemento.replace('\\"', '');
          return elemento;
        });

        arreglo = arreglo.map((elemento: any) => {
          elemento = elemento.replace('"', '');
          return elemento;
        });

        arreglo = arreglo.map((elemento: any) => {
          elemento = elemento.replace('\\', '');
          return elemento;
        });

        arreglo[0] = arreglo[0].replace('{', '');
        arreglo[arreglo.length - 1] = arreglo[arreglo.length - 1].replace(
          '}',
          ''
        );

        const resultadoObjeto: any = {};

        arreglo.forEach((dato: any) => {
          const [clave, valor] = dato.split(':');
          resultadoObjeto[clave] = valor.trim();
        });

        obtener[i] = resultadoObjeto;
      }
      this.Materias = obtener;
      await this.obtener_cantidadEstudiantes();
    } else {
      //almacenar los datos filtrados devueltos por la api en una nueva variable
      this.materias$ = await new Promise((resolve, reject) => {
        this._getMateriasCasosUso.getMateriasAll(materia).subscribe(
          (Resp: any) => {
            resolve(Resp);
          },
          (error: any) => {
            reject(error);
          }
        );
      });
      //guardar en variable tipo array(para poder recorrer cada objeto en un for) los datos obtenidos
      this.Materias = this.materias$;
      this.datosLocales.guardar_ArregloLocal(
        'MateriaInformacion',
        this.Materias
      );
    }

    await this.obtener_cantidadEstudiantes();
  }

  //guardar los valores de nrc y carrera para la visualización de su lista de asistencia correspondiente
  enviarDato(nrc: any, carrera: any) {
    this.servicedatos.setCarrera(carrera);
    this.servicedatos.setNrc(nrc);
  }
}
