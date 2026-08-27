const CACHE_NAME =
    "hydr8-cache-v1";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./style.css",

    "./app.js",

    "./manifest.json"

];



/* ========================= */
/* INSTALL */
/* ========================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache =>
                    cache.addAll(
                        FILES_TO_CACHE
                    )
                )

        );


        self.skipWaiting();

    }
);



/* ========================= */
/* ACTIVATE */
/* ========================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(keys =>

                    Promise.all(

                        keys
                            .filter(
                                key =>
                                    key !==
                                    CACHE_NAME
                            )

                            .map(
                                key =>
                                    caches.delete(
                                        key
                                    )
                            )

                    )

                )

        );


        self.clients.claim();

    }
);



/* ========================= */
/* FETCH */
/* ========================= */

self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(
                event.request
            )

            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }


                return fetch(
                    event.request
                )

                .then(response => {

                    if (
                        !response ||
                        response.status !== 200 ||
                        response.type === "opaque"
                    ) {

                        return response;

                    }


                    const responseClone =
                        response.clone();


                    caches
                        .open(CACHE_NAME)
                        .then(cache => {

                            cache.put(
                                event.request,
                                responseClone
                            );

                        });


                    return response;

                })

                .catch(() => {

                    return caches.match(
                        "./index.html"
                    );

                });

            })

        );

    }
);
