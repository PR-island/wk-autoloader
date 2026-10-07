# WK Autoloader

> **Fork note (Payload Manager v0.5.2 + auto-start):** this fork keeps
> X-F1REBALL-X's offline cache, Relapse chain and elfldr `:9021` unchanged.
> It only (1) bundles [itsPLK/ps5-payload-manager v0.5.2](https://github.com/itsPLK/ps5-payload-manager/releases/tag/v0.5.2)
> (FW 13.60 support, SHA256 `62b3ba2a4937c2afc502f9a4e7242cca538610ebb4ae2800c7c6f72e7f268e7c`)
> as `pldmgr.elf`, and (2) always selects Payload Manager and always
> auto-starts the jailbreak immediately on open; the launcher
> choice is hidden and the installer no longer adds the Elf Launcher icon.
> Flow: WK cache → Relapse → elfldr `:9021` → `pldmgr.elf` → `:8084`.
> Upstream: https://github.com/X-F1REBALL-X/wk-autoloader

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

1. Soft jailbreak; start [elfldr](https://github.com/ps5-payload-dev/elfldr) on `9021`.
2. Send the [WK Autoloader ELF](https://github.com/X-F1REBALL-X/wk-autoloader/releases/latest); wait for install/cache.
3. Open `http://PS5_IP:1022` or [Pages](https://x-f1reball-x.github.io/wk-autoloader/).
4. This fork starts automatically with Payload Manager (upstream: pick Payload Manager or Elf Launcher, then **Start Jailbreak**).

## Ports

| Port | Role |
|------|------|
| **1022** | [WK Autoloader](https://github.com/X-F1REBALL-X/wk-autoloader) |
| **9021** | [elfldr](https://github.com/ps5-payload-dev/elfldr) |
| **8084** | [Payload Manager](https://github.com/itsPLK/ps5-payload-manager) |
| **1000** | [Elf Launcher](https://github.com/X-F1REBALL-X/elf-launcher) |

## Firmware

| FW | Chain |
|----|-------|
| 1.xx-5.50 | umtx2 |
| 6.xx | unsupported |
| 7.00-13.60 | relapse |

## Credits

Full list of everyone who contributed to the bundled components (Relapse, umtx2, slopkit, Payload Manager and its translators, elfldr, PS5 Payload SDK, libraries): **[CREDITS.md](CREDITS.md)**.

**X-F1REBALL-X** - packaging, routing, UI, offline cache (original [wk-autoloader](https://github.com/X-F1REBALL-X/wk-autoloader)).

**itsPLK** - [Payload Manager](https://github.com/itsPLK/ps5-payload-manager) (bundled v0.5.2), [ps5-elfldr](https://github.com/itsPLK/ps5-elfldr), [ps5-unified-autoloader](https://github.com/itsPLK/ps5-unified-autoloader), [slopkit](https://github.com/itsPLK/slopkit) fork, [ps5-webkit-autoloader](https://github.com/itsPLK/ps5-webkit-autoloader).

**[ps5-payload-dev](https://github.com/ps5-payload-dev)** / @john-tornblom - [PS5 Payload SDK](https://github.com/ps5-payload-dev/sdk) and [elfldr](https://github.com/ps5-payload-dev/elfldr).

### umtx2 (1.xx-5.50)

[idlesauce/umtx2](https://github.com/idlesauce/umtx2): exploit largely from @shahrilnet / @n0llptr (lua UMTX); setup from @SpecterDev / @ChendoChap ([PS5-UMTX-Jailbreak](https://github.com/PS5Dev/PS5-UMTX-Jailbreak/)); PSFree by abc; ELF loader by @john-tornblom.

### Relapse (7.00-13.60)

ntfargo, ufm42, Sonic_Iso, Jordy, Dr. Yenyen, TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion
