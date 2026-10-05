# WK Autoloader

![WK Autoloader preview](docs/screenshots/home.png)

PS5 jailbreak host on port **1022**.

- Pages: https://x-f1reball-x.github.io/wk-autoloader/
- Download ELF: https://github.com/X-F1REBALL-X/wk-autoloader/releases/latest

## Features

- Media home app + offline UI cache after one install
- Chains: **umtx2** (1-5.50), **relapse** (7.00-13.60)
- Post-JB: **Payload Manager** (`:8084`) or **Elf Launcher** Hybrid (`:1000`)
- Hybrid sends current Elf tip when `:1000` is down; opens (and triggers Auto) when up
- Tip stays synced with [Elf Launcher](https://github.com/X-F1REBALL-X/elf-launcher)
- **10 languages:** en, ar, es, fr, de, pt, ru, ja, zh, it (shared `ps5elfs-lang` with Elf)

## Usage

1. Soft jailbreak; start elfldr on `9021`.
2. Send `wk-dual-payload.elf`; wait for install/cache.
3. Open `http://PS5_IP:1022` or Pages.
4. Pick Payload Manager or Elf Launcher, then **Start Jailbreak**.

## Ports

| Port | Role |
|------|------|
| **1022** | WK Autoloader |
| **9021** | elfldr |
| **8084** | Payload Manager |
| **1000** | [Elf Launcher](https://github.com/X-F1REBALL-X/elf-launcher) |

## Firmware

| FW | Chain |
|----|-------|
| 1.xx-5.50 | umtx2 |
| 6.xx | unsupported |
| 7.00-13.60 | relapse |

## Credits

**X-F1REBALL-X** - packaging, routing, UI.

### umtx2 (1.xx-5.50)

[idlesauce/umtx2](https://github.com/idlesauce/umtx2): exploit largely from @shahrilnet / @n0llptr (lua UMTX); setup from @SpecterDev / @ChendoChap ([PS5-UMTX-Jailbreak](https://github.com/PS5Dev/PS5-UMTX-Jailbreak/)); PSFree by abc; ELF loader by @john-tornblom.

### Relapse (7.00-13.60)

ntfargo, ufm42, Sonic_Iso, Jordy, Dr. Yenyen, TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion
