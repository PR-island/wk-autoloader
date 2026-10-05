#pragma once

/* 1 when the WK Autoloader homescreen page is already on disk. */
int wkali_page_installed(void);

/* Installs the WK Autoloader homescreen page only when it is missing. */
int wkali_install_app(void);

/* Install Elf Launcher (ELFL00001) and Payload Manager (PLDM00001)
 * homescreen pages only when each is missing. Does not start either
 * server and does not autoload any payloads. */
int wkali_install_companions(void);
