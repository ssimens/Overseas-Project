// Questo intereceptor aggiunge ad ogni richiesta http il token dentro l'header

import { HttpInterceptorFn } from "@angular/common/http";

// Una funzione: HttpInterceptorFn viene eseguita ad ogni richiesta HTTP
export const authInterceptor: HttpInterceptorFn = (req, next) => {

    // Creo una nuova richiesta, HTTP essendo esse immutabili
    const modifiedRequest = req.clone({
      withCredentials: true
    });

    return next(modifiedRequest); // Mando avanti nuova richiesta

};