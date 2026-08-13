import axios from 'axios';

/**
 * Cliente axios para peticiones que no pasan por el router de Inertia
 * (búsquedas incrementales, subida de archivos). Laravel exige el token
 * CSRF en la cabecera `X-XSRF-TOKEN`, que ya coloca la cookie `XSRF-TOKEN`.
 */
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export default axios;
