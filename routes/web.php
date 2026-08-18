<?php

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\BuscadorController;
use App\Http\Controllers\CitaController;
use App\Http\Controllers\ClinicaController;
use App\Http\Controllers\ConsultaController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\DocumentoController;
use App\Http\Controllers\DocumentoImportController;
use App\Http\Controllers\EspecialidadController;
use App\Http\Controllers\FichaPublicaController;
use App\Http\Controllers\LaboratorioController;
use App\Http\Controllers\PacienteController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\PersonaController;
use App\Http\Controllers\RecepcionistaController;
use App\Http\Controllers\RecetaController;
use App\Http\Controllers\RevisarController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\TipoVacunaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Ficha pública por QR
|--------------------------------------------------------------------------
| Accesible sin sesión: es la URL que codifica el código QR impreso en la
| ficha del paciente.
*/
Route::get('fichaqr/{paciente}', [FichaPublicaController::class, 'show'])->name('fichaqr');

/*
|--------------------------------------------------------------------------
| Aplicación
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:administrador|doctor|recepcionista'])->group(function () {

    // --- Búsquedas para los selectores ---------------------------------
    Route::get('buscar/pacientes', [BuscadorController::class, 'pacientes'])->name('buscar.pacientes');
    Route::get('buscar/doctores-especialidad/{especialidad}', [BuscadorController::class, 'doctoresPorEspecialidad'])->name('buscar.doctores-especialidad');

    // --- Foto de perfil --------------------------------------------------
    Route::post('mi-avatar', [AvatarController::class, 'store'])->name('avatar.store');

    // --- Inicio: agenda de citas médicas -------------------------------
    Route::get('/', [CitaController::class, 'index'])->name('home');
    Route::get('dashboard', [CitaController::class, 'index'])->name('dashboard');
    Route::get('citas/eventos', [CitaController::class, 'eventos'])->name('citas.eventos');
    Route::post('citas', [CitaController::class, 'store'])->name('citas.store')->middleware('permission:crear-citas');
    Route::put('citas/{cita}', [CitaController::class, 'update'])->name('citas.update')->middleware('permission:editar-citas');
    Route::put('citas/{cita}/mover', [CitaController::class, 'mover'])->name('citas.mover')->middleware('permission:editar-citas');
    Route::delete('citas/{cita}', [CitaController::class, 'destroy'])->name('citas.destroy')->middleware('permission:eliminar-citas');

    // --- Consultas médicas ---------------------------------------------
    Route::middleware('permission:leer-citas')->group(function () {
        Route::get('consultas', [ConsultaController::class, 'index'])->name('consultas.index');
        Route::get('consultas/{consulta}', [ConsultaController::class, 'show'])->name('consultas.show');
    });
    Route::put('consultas/{consulta}/atender', [ConsultaController::class, 'atender'])
        ->name('consultas.atender')
        ->middleware('permission:editar-atender');
    Route::delete('consultas/{consulta}', [ConsultaController::class, 'destroy'])
        ->name('consultas.destroy')
        ->middleware('permission:eliminar-consultas');

    // --- Pacientes ------------------------------------------------------
    Route::middleware('permission:leer-pacientes')->group(function () {
        Route::get('pacientes', [PacienteController::class, 'index'])->name('pacientes.index');
        Route::get('pacientes/{paciente}/ficha', [PacienteController::class, 'ficha'])->name('pacientes.ficha');
        Route::get('pacientes/{paciente}/expediente', [PacienteController::class, 'expediente'])->name('pacientes.expediente');
        Route::get('pacientes/{paciente}/ficha/pdf', [PacienteController::class, 'fichaPdf'])->name('pacientes.ficha.pdf');
        Route::get('pacientes/{paciente}/expediente/{consulta}/pdf', [PacienteController::class, 'expedientePdf'])->name('pacientes.expediente.pdf');
        Route::post('pacientes', [PacienteController::class, 'store'])->name('pacientes.store')->middleware('permission:crear-pacientes');
        Route::put('pacientes/{paciente}', [PacienteController::class, 'update'])->name('pacientes.update')->middleware('permission:editar-pacientes');
        Route::delete('pacientes/{paciente}', [PacienteController::class, 'destroy'])->name('pacientes.destroy')->middleware('permission:eliminar-pacientes');

        // Documentos adjuntos por consulta / paciente
        Route::get('documentos-pacientes', [DocumentoController::class, 'index'])->name('documentos.index');
        Route::get('documentos/paciente/{paciente}', [DocumentoController::class, 'consultasDelPaciente'])->name('documentos.paciente');
        Route::get('documentos/{consulta}', [DocumentoController::class, 'show'])->name('documentos.show');
        Route::post('documentos/{consulta}', [DocumentoController::class, 'store'])->name('documentos.store');
        Route::get('documentos/{consulta}/zip', [DocumentoController::class, 'zip'])->name('documentos.zip');
        Route::get('documentos/archivo/{archivo}', [DocumentoController::class, 'descargar'])->name('documentos.descargar');
        Route::delete('documentos/archivo/{archivo}', [DocumentoController::class, 'destroy'])->name('documentos.destroy');

        // Documentos copiados directo al servidor, sin vincular todavía
        Route::get('documentos-importar', [DocumentoImportController::class, 'index'])->name('documentos.importar.index');
        Route::get('documentos-importar/ver/{archivo}', [DocumentoImportController::class, 'ver'])->name('documentos.importar.ver');
        Route::post('documentos-importar/vincular', [DocumentoImportController::class, 'vincular'])->name('documentos.importar.vincular');
        Route::post('documentos-importar/vincular-automaticos', [DocumentoImportController::class, 'vincularAutomaticos'])->name('documentos.importar.vincular-automaticos');
        Route::post('documentos-importar/corregir-vinculados', [DocumentoImportController::class, 'corregirVinculados'])->name('documentos.importar.corregir-vinculados');

        // Siguientes citas
        Route::get('revisar', [RevisarController::class, 'index'])->name('revisar.index');
    });

    // --- Laboratorio ------------------------------------------------------
    Route::middleware('permission:leer-laboratorio')->group(function () {
        Route::get('laboratorio', [LaboratorioController::class, 'index'])->name('laboratorio.index');
        Route::get('laboratorio/paciente/{paciente}', [LaboratorioController::class, 'consultasDelPaciente'])->name('laboratorio.paciente');
        Route::get('laboratorio/{laboratorio}', [LaboratorioController::class, 'show'])->name('laboratorio.show');
        Route::get('laboratorio/{laboratorio}/informe', [LaboratorioController::class, 'informePdf'])->name('laboratorio.informe');
        Route::post('laboratorio', [LaboratorioController::class, 'store'])->name('laboratorio.store')->middleware('permission:crear-laboratorio');
        Route::put('laboratorio/{laboratorio}', [LaboratorioController::class, 'update'])->name('laboratorio.update')->middleware('permission:editar-laboratorio');
        Route::delete('laboratorio/{laboratorio}', [LaboratorioController::class, 'destroy'])->name('laboratorio.destroy')->middleware('permission:eliminar-laboratorio');
    });

    // --- Receta médica imprimible ---------------------------------------
    Route::get('receta/{consulta}', [RecetaController::class, 'show'])->name('receta.show')->middleware('permission:leer-citas');

    // --- Mantenimiento ---------------------------------------------------
    Route::middleware('permission:leer-doctores')->group(function () {
        Route::get('doctores', [DoctorController::class, 'index'])->name('doctores.index');
        Route::post('doctores', [DoctorController::class, 'store'])->name('doctores.store')->middleware('permission:crear-doctores');
        Route::put('doctores/{doctor}', [DoctorController::class, 'update'])->name('doctores.update')->middleware('permission:editar-doctores');
        Route::delete('doctores/{doctor}', [DoctorController::class, 'destroy'])->name('doctores.destroy')->middleware('permission:eliminar-doctores');
        Route::put('doctores/{doctor}/clave', [DoctorController::class, 'actualizarClave'])->name('doctores.clave');
        Route::put('doctores/{doctor}/especialidades', [DoctorController::class, 'sincronizarEspecialidades'])->name('doctores.especialidades');
        Route::get('doctores/{doctor}/dias', [DoctorController::class, 'dias'])->name('doctores.dias');
        Route::post('doctores/{doctor}/dias', [DoctorController::class, 'guardarDia'])->name('doctores.dias.store');
        Route::delete('doctores/dias/{dia}', [DoctorController::class, 'eliminarDia'])->name('doctores.dias.destroy');
    });

    Route::middleware('permission:leer-recepcionistas')->group(function () {
        Route::get('recepcionistas', [RecepcionistaController::class, 'index'])->name('recepcionistas.index');
        Route::post('recepcionistas', [RecepcionistaController::class, 'store'])->name('recepcionistas.store')->middleware('permission:crear-recepcionistas');
        Route::put('recepcionistas/{recepcionista}', [RecepcionistaController::class, 'update'])->name('recepcionistas.update')->middleware('permission:editar-recepsionistas');
        Route::delete('recepcionistas/{recepcionista}', [RecepcionistaController::class, 'destroy'])->name('recepcionistas.destroy');
        Route::put('recepcionistas/{recepcionista}/clave', [RecepcionistaController::class, 'actualizarClave'])->name('recepcionistas.clave');
    });

    Route::middleware('permission:leer-especialidades')->group(function () {
        Route::get('especialidades', [EspecialidadController::class, 'index'])->name('especialidades.index');
        Route::post('especialidades', [EspecialidadController::class, 'store'])->name('especialidades.store')->middleware('permission:crear-especialidades');
        Route::put('especialidades/{especialidad}', [EspecialidadController::class, 'update'])->name('especialidades.update')->middleware('permission:editar-especialidades');
        Route::delete('especialidades/{especialidad}', [EspecialidadController::class, 'destroy'])->name('especialidades.destroy')->middleware('permission:eliminar-especialidades');
    });

    Route::middleware('permission:leer-vacunas')->group(function () {
        Route::get('vacunas', [TipoVacunaController::class, 'index'])->name('vacunas.index');
        Route::post('vacunas', [TipoVacunaController::class, 'store'])->name('vacunas.store')->middleware('permission:crear-vacunas');
        Route::put('vacunas/{vacuna}', [TipoVacunaController::class, 'update'])->name('vacunas.update')->middleware('permission:editar-vacunas');
        Route::delete('vacunas/{vacuna}', [TipoVacunaController::class, 'destroy'])->name('vacunas.destroy')->middleware('permission:eliminar-vacunas');
    });

    // --- Configuración ----------------------------------------------------
    Route::middleware('permission:leer-clinicas')->group(function () {
        Route::get('clinica', [ClinicaController::class, 'index'])->name('clinica.index');
        Route::post('clinica', [ClinicaController::class, 'store'])->name('clinica.store')->middleware('permission:crear-clinicas');
        Route::put('clinica/{clinica}', [ClinicaController::class, 'update'])->name('clinica.update')->middleware('permission:editar-clinicas');
        Route::delete('clinica/{clinica}', [ClinicaController::class, 'destroy'])->name('clinica.destroy')->middleware('permission:eliminar-clinicas');
    });

    Route::middleware('permission:leer-personas')->group(function () {
        Route::get('personas', [PersonaController::class, 'index'])->name('personas.index');
        Route::post('personas', [PersonaController::class, 'store'])->name('personas.store')->middleware('permission:crear-personas');
        Route::put('personas/{persona}', [PersonaController::class, 'update'])->name('personas.update')->middleware('permission:editar-personas');
        Route::delete('personas/{persona}', [PersonaController::class, 'destroy'])->name('personas.destroy')->middleware('permission:eliminar-personas');
        Route::put('personas/{persona}/roles', [PersonaController::class, 'sincronizarRoles'])->name('personas.roles')->middleware('permission:leer-roles');
        Route::put('personas/{persona}/clave', [PersonaController::class, 'actualizarClave'])->name('personas.clave');
    });

    Route::middleware('permission:leer-roles')->group(function () {
        Route::get('roles', [RolController::class, 'index'])->name('roles.index');
        Route::post('roles', [RolController::class, 'store'])->name('roles.store')->middleware('permission:crear-roles');
        Route::put('roles/{rol}', [RolController::class, 'update'])->name('roles.update')->middleware('permission:editar-roles');
        Route::delete('roles/{rol}', [RolController::class, 'destroy'])->name('roles.destroy')->middleware('permission:eliminar-roles');
        Route::put('roles/{rol}/permisos', [RolController::class, 'sincronizarPermisos'])->name('roles.permisos');
    });

    Route::middleware('permission:leer-permisos')->group(function () {
        Route::get('permisos', [PermisoController::class, 'index'])->name('permisos.index');
        Route::post('permisos', [PermisoController::class, 'store'])->name('permisos.store')->middleware('permission:crear-permisos');
        Route::put('permisos/{permiso}', [PermisoController::class, 'update'])->name('permisos.update')->middleware('permission:editar-permisos');
        Route::delete('permisos/{permiso}', [PermisoController::class, 'destroy'])->name('permisos.destroy')->middleware('permission:eliminar-permisos');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
