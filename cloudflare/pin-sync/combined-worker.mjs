import ranking from '../rankings/integrated.mjs';
import {createIntegratedWorker} from './pin-worker.mjs';
import profile from './assets/profile.txt';
import login from './assets/login.txt';
import transport from './assets/transport.txt';
import scram from './assets/scram.txt';

export default createIntegratedWorker(ranking,{profile,login,transport,scram});
