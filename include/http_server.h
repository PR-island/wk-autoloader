#pragma once

/* Release tree marker: v1.0.0. */

#include <microhttpd.h>
#include <stdatomic.h>

/* Shared flag - set to 0 by /exit only; /install keeps :1022 up for home deeplink. */
extern atomic_int http_keep_running;

/* Set to 1 only when /install succeeds so shutdown knows to notify success. */
extern atomic_int install_completed;

/* MHD request handler callback - dispatches all routes. */
enum MHD_Result http_on_request(void *cls, struct MHD_Connection *conn,
                                const char *url, const char *method,
                                const char *version, const char *upload_data,
                                size_t *upload_data_size, void **con_cls);
