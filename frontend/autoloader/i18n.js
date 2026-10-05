/* WK Autoloader i18n — same 10 languages as Elf Launcher (no Hebrew). */
(function (global) {
'use strict';
var LANGS = [{"code": "en", "name": "English", "flag": "us"}, {"code": "ar", "name": "العربية", "flag": "sa", "rtl": true}, {"code": "es", "name": "Español", "flag": "es"}, {"code": "fr", "name": "Français", "flag": "fr"}, {"code": "de", "name": "Deutsch", "flag": "de"}, {"code": "pt", "name": "Português", "flag": "br"}, {"code": "ru", "name": "Русский", "flag": "ru"}, {"code": "ja", "name": "日本語", "flag": "jp"}, {"code": "zh", "name": "中文", "flag": "cn"}, {"code": "it", "name": "Italiano", "flag": "it"}];
var FLAGS = {"us": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"20\" fill=\"#fff\"/><g fill=\"#b22234\"><rect width=\"30\" height=\"1.54\"/><rect y=\"3.08\" width=\"30\" height=\"1.54\"/><rect y=\"6.15\" width=\"30\" height=\"1.54\"/><rect y=\"9.23\" width=\"30\" height=\"1.54\"/><rect y=\"12.3\" width=\"30\" height=\"1.54\"/><rect y=\"15.4\" width=\"30\" height=\"1.54\"/><rect y=\"18.46\" width=\"30\" height=\"1.54\"/></g><rect width=\"13\" height=\"10.77\" fill=\"#3c3b6e\"/><g fill=\"#fff\"><circle cx=\"2.5\" cy=\"2.2\" r=\".7\"/><circle cx=\"6.5\" cy=\"2.2\" r=\".7\"/><circle cx=\"10.5\" cy=\"2.2\" r=\".7\"/><circle cx=\"4.5\" cy=\"5.4\" r=\".7\"/><circle cx=\"8.5\" cy=\"5.4\" r=\".7\"/><circle cx=\"2.5\" cy=\"8.6\" r=\".7\"/><circle cx=\"6.5\" cy=\"8.6\" r=\".7\"/><circle cx=\"10.5\" cy=\"8.6\" r=\".7\"/></g></svg>", "sa": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"20\" fill=\"#006c35\"/><path d=\"M8 8.5h14M9 10c2 .8 4 .8 6 0s4-.8 6 0\" stroke=\"#fff\" stroke-width=\"1.1\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M8 14h13l1.5-1\" stroke=\"#fff\" stroke-width=\"1\" fill=\"none\" stroke-linecap=\"round\"/></svg>", "es": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"20\" fill=\"#aa151b\"/><rect y=\"5\" width=\"30\" height=\"10\" fill=\"#f1bf00\"/></svg>", "fr": "<svg viewBox=\"0 0 30 20\"><rect width=\"10\" height=\"20\" fill=\"#0055a4\"/><rect x=\"10\" width=\"10\" height=\"20\" fill=\"#fff\"/><rect x=\"20\" width=\"10\" height=\"20\" fill=\"#ef4135\"/></svg>", "de": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"6.67\" fill=\"#000\"/><rect y=\"6.67\" width=\"30\" height=\"6.67\" fill=\"#dd0000\"/><rect y=\"13.33\" width=\"30\" height=\"6.67\" fill=\"#ffce00\"/></svg>", "br": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"20\" fill=\"#009c3b\"/><path d=\"M15 2.5L27 10 15 17.5 3 10z\" fill=\"#ffdf00\"/><circle cx=\"15\" cy=\"10\" r=\"4.2\" fill=\"#002776\"/><path d=\"M11 9.3c2.7-.6 5.6-.3 8 .9\" stroke=\"#fff\" stroke-width=\".7\" fill=\"none\"/></svg>", "ru": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"6.67\" fill=\"#fff\"/><rect y=\"6.67\" width=\"30\" height=\"6.67\" fill=\"#0039a6\"/><rect y=\"13.33\" width=\"30\" height=\"6.67\" fill=\"#d52b1e\"/></svg>", "jp": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"20\" fill=\"#fff\"/><circle cx=\"15\" cy=\"10\" r=\"6\" fill=\"#bc002d\"/></svg>", "cn": "<svg viewBox=\"0 0 30 20\"><rect width=\"30\" height=\"20\" fill=\"#de2910\"/><path d=\"M5 2.5l1.18 3.6H10l-3.1 2.2 1.2 3.6L5 9.7l-3.1 2.2 1.2-3.6L0 6.1h3.8z\" fill=\"#ffde00\"/><g fill=\"#ffde00\"><circle cx=\"11\" cy=\"2.5\" r=\".9\"/><circle cx=\"13\" cy=\"4.6\" r=\".9\"/><circle cx=\"13\" cy=\"7.6\" r=\".9\"/><circle cx=\"11\" cy=\"9.6\" r=\".9\"/></g></svg>", "it": "<svg viewBox=\"0 0 30 20\"><rect width=\"10\" height=\"20\" fill=\"#009246\"/><rect x=\"10\" width=\"10\" height=\"20\" fill=\"#fff\"/><rect x=\"20\" width=\"10\" height=\"20\" fill=\"#ce2b37\"/></svg>"};
var I18N = {"en": {"language": "Language", "langSet": "Language: English", "credit": "Created by X-F1REBALL-X", "supportTitle": "Supported FW 1.00-5.50 / 7.00-13.60", "detecting": "Detecting console...", "consoleNotDetected": "Console not detected", "fwChain": "PS5 FW {fw} · chain {chain}", "fwUnsupported": "PS5 FW {fw} · not supported", "afterJb": "After jailbreak, open", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager on :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "Hybrid: open :1000 or send tip ELF", "autoStartJb": "Auto-start jailbreak", "startJailbreak": "Start Jailbreak", "cancel": "Cancel", "choiceSaved": "Choice is saved on this console", "elfLauncherPage": "Elf Launcher page", "jailbreakStarted": "Jailbreak started", "jailbreakSuccess": "Jailbreak completed successfully", "jailbreakFail": "Jailbreak failed - restart your console", "jailbreakInProgress": "Jailbreak in progress", "elapsed": "Elapsed {t}", "metaFwChain": "FW {fw} · chain {chain}", "metaFwUnsupported": "FW {fw} · not supported", "startingIn": "Starting in {n}…", "starting": "Starting…", "pageNotOpen": "{label} page not open yet - Retry below", "jbOkNoAnswer": "JB OK. {label} did not answer on :{port} in time.", "retrySendOpen": "Retry send + open {label} (:{port})", "resending": "Re-sending...", "installing": "Installing…", "installSuccess": "Updated successfully\nOpening WK Autoloader…", "update": "Update", "selfUpdate": "WK Autoloader {ver} is available", "selfUpdateLater": "Later", "selfUpdating": "Sending WK Autoloader {ver} to elfldr...", "selfUpdated": "Sent WK Autoloader {ver} to elfldr (:9021).", "selfUpdateOpened": "Opened the WK Autoloader {ver} download.", "selfUpdateFail": "WK Autoloader update failed: {msg}", "selfUpdateNoElfldr": "elfldr :9021 is not running - jailbreak first", "selfUpdateAfterJb": "Update will run after jailbreak"}, "ar": {"language": "اللغة", "langSet": "اللغة: العربية", "credit": "من إعداد X-F1REBALL-X", "supportTitle": "الإصدارات المدعومة 1.00-5.50 / 7.00-13.60", "detecting": "جارٍ اكتشاف الجهاز...", "consoleNotDetected": "لم يتم اكتشاف الجهاز", "fwChain": "PS5 FW {fw} · السلسلة {chain}", "fwUnsupported": "PS5 FW {fw} · غير مدعوم", "afterJb": "بعد كسر الحماية، افتح", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager على :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "هجين: افتح :1000 أو أرسل ELF", "autoStartJb": "بدء كسر الحماية تلقائياً", "startJailbreak": "بدء كسر الحماية", "cancel": "إلغاء", "choiceSaved": "يُحفظ الاختيار على هذا الجهاز", "elfLauncherPage": "صفحة Elf Launcher", "jailbreakStarted": "بدأ كسر الحماية", "jailbreakSuccess": "اكتمل كسر الحماية بنجاح", "jailbreakFail": "فشل كسر الحماية - أعد تشغيل الجهاز", "jailbreakInProgress": "كسر الحماية قيد التنفيذ", "elapsed": "الوقت المنقضي {t}", "metaFwChain": "FW {fw} · السلسلة {chain}", "metaFwUnsupported": "FW {fw} · غير مدعوم", "startingIn": "يبدأ خلال {n}…", "starting": "جارٍ البدء…", "pageNotOpen": "صفحة {label} لم تُفتح بعد - إعادة المحاولة أدناه", "jbOkNoAnswer": "نجح كسر الحماية. {label} لم يرد على :{port} في الوقت المحدد.", "retrySendOpen": "أعد الإرسال وافتح {label} (:{port})", "resending": "جارٍ إعادة الإرسال...", "installing": "جارٍ التثبيت…", "installSuccess": "تم التحديث بنجاح\nجارٍ فتح WK Autoloader…", "update": "تحديث", "selfUpdate": "إصدار WK Autoloader {ver} متاح", "selfUpdateLater": "لاحقًا", "selfUpdating": "جارٍ إرسال WK Autoloader {ver} إلى elfldr...", "selfUpdated": "تم إرسال WK Autoloader {ver} إلى elfldr (:9021).", "selfUpdateOpened": "تم فتح تنزيل WK Autoloader {ver}.", "selfUpdateFail": "فشل تحديث WK Autoloader: {msg}", "selfUpdateNoElfldr": "elfldr :9021 لا يعمل - نفّذ كسر الحماية أولًا", "selfUpdateAfterJb": "سيُنفَّذ التحديث بعد كسر الحماية"}, "es": {"language": "Idioma", "langSet": "Idioma: Español", "credit": "Creado por X-F1REBALL-X", "supportTitle": "FW compatibles 1.00-5.50 / 7.00-13.60", "detecting": "Detectando consola...", "consoleNotDetected": "Consola no detectada", "fwChain": "PS5 FW {fw} · cadena {chain}", "fwUnsupported": "PS5 FW {fw} · no compatible", "afterJb": "Tras el jailbreak, abrir", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager en :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "Híbrido: abrir :1000 o enviar ELF tip", "autoStartJb": "Iniciar jailbreak automáticamente", "startJailbreak": "Iniciar jailbreak", "cancel": "Cancelar", "choiceSaved": "La elección se guarda en esta consola", "elfLauncherPage": "Página de Elf Launcher", "jailbreakStarted": "Jailbreak iniciado", "jailbreakSuccess": "Jailbreak completado con éxito", "jailbreakFail": "Jailbreak fallido - reinicia la consola", "jailbreakInProgress": "Jailbreak en curso", "elapsed": "Transcurrido {t}", "metaFwChain": "FW {fw} · cadena {chain}", "metaFwUnsupported": "FW {fw} · no compatible", "startingIn": "Empieza en {n}…", "starting": "Iniciando…", "pageNotOpen": "La página de {label} aún no está abierta - Reintentar abajo", "jbOkNoAnswer": "JB OK. {label} no respondió en :{port} a tiempo.", "retrySendOpen": "Reenviar y abrir {label} (:{port})", "resending": "Reenviando...", "installing": "Instalando…", "installSuccess": "Actualizado correctamente\nAbriendo WK Autoloader…", "update": "Actualizar", "selfUpdate": "WK Autoloader {ver} disponible", "selfUpdateLater": "Más tarde", "selfUpdating": "Enviando WK Autoloader {ver} a elfldr...", "selfUpdated": "WK Autoloader {ver} enviado a elfldr (:9021).", "selfUpdateOpened": "Se abrió la descarga de WK Autoloader {ver}.", "selfUpdateFail": "Error al actualizar WK Autoloader: {msg}", "selfUpdateNoElfldr": "elfldr :9021 no está activo - haz el jailbreak primero", "selfUpdateAfterJb": "La actualización se aplicará después del jailbreak"}, "fr": {"language": "Langue", "langSet": "Langue : Français", "credit": "Créé par X-F1REBALL-X", "supportTitle": "FW pris en charge 1.00-5.50 / 7.00-13.60", "detecting": "Détection de la console...", "consoleNotDetected": "Console non détectée", "fwChain": "PS5 FW {fw} · chaîne {chain}", "fwUnsupported": "PS5 FW {fw} · non pris en charge", "afterJb": "Après le jailbreak, ouvrir", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager sur :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "Hybride : ouvrir :1000 ou envoyer l’ELF tip", "autoStartJb": "Démarrer le jailbreak automatiquement", "startJailbreak": "Démarrer le jailbreak", "cancel": "Annuler", "choiceSaved": "Le choix est enregistré sur cette console", "elfLauncherPage": "Page Elf Launcher", "jailbreakStarted": "Jailbreak démarré", "jailbreakSuccess": "Jailbreak terminé avec succès", "jailbreakFail": "Échec du jailbreak - redémarrez la console", "jailbreakInProgress": "Jailbreak en cours", "elapsed": "Écoulé {t}", "metaFwChain": "FW {fw} · chaîne {chain}", "metaFwUnsupported": "FW {fw} · non pris en charge", "startingIn": "Démarrage dans {n}…", "starting": "Démarrage…", "pageNotOpen": "Page {label} pas encore ouverte - Réessayer ci-dessous", "jbOkNoAnswer": "JB OK. {label} n’a pas répondu sur :{port} à temps.", "retrySendOpen": "Renvoyer et ouvrir {label} (:{port})", "resending": "Nouvel envoi...", "installing": "Installation…", "installSuccess": "Mise à jour réussie\nOuverture de WK Autoloader…", "update": "Mettre à jour", "selfUpdate": "WK Autoloader {ver} disponible", "selfUpdateLater": "Plus tard", "selfUpdating": "Envoi de WK Autoloader {ver} à elfldr...", "selfUpdated": "WK Autoloader {ver} envoyé à elfldr (:9021).", "selfUpdateOpened": "Téléchargement de WK Autoloader {ver} ouvert.", "selfUpdateFail": "Échec de la mise à jour de WK Autoloader : {msg}", "selfUpdateNoElfldr": "elfldr :9021 ne tourne pas - faites d’abord le jailbreak", "selfUpdateAfterJb": "La mise à jour s'appliquera après le jailbreak"}, "de": {"language": "Sprache", "langSet": "Sprache: Deutsch", "credit": "Erstellt von X-F1REBALL-X", "supportTitle": "Unterstützte FW 1.00-5.50 / 7.00-13.60", "detecting": "Konsole wird erkannt...", "consoleNotDetected": "Konsole nicht erkannt", "fwChain": "PS5 FW {fw} · Kette {chain}", "fwUnsupported": "PS5 FW {fw} · nicht unterstützt", "afterJb": "Nach dem Jailbreak öffnen", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager auf :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "Hybrid: :1000 öffnen oder Tip-ELF senden", "autoStartJb": "Jailbreak automatisch starten", "startJailbreak": "Jailbreak starten", "cancel": "Abbrechen", "choiceSaved": "Auswahl wird auf dieser Konsole gespeichert", "elfLauncherPage": "Elf-Launcher-Seite", "jailbreakStarted": "Jailbreak gestartet", "jailbreakSuccess": "Jailbreak erfolgreich abgeschlossen", "jailbreakFail": "Jailbreak fehlgeschlagen - Konsole neu starten", "jailbreakInProgress": "Jailbreak läuft", "elapsed": "Vergangen {t}", "metaFwChain": "FW {fw} · Kette {chain}", "metaFwUnsupported": "FW {fw} · nicht unterstützt", "startingIn": "Start in {n}…", "starting": "Startet…", "pageNotOpen": "{label}-Seite noch nicht geöffnet - Unten erneut versuchen", "jbOkNoAnswer": "JB OK. {label} hat auf :{port} nicht rechtzeitig geantwortet.", "retrySendOpen": "Erneut senden + {label} öffnen (:{port})", "resending": "Wird erneut gesendet...", "installing": "Installation…", "installSuccess": "Erfolgreich aktualisiert\nWK Autoloader wird geöffnet…", "update": "Aktualisieren", "selfUpdate": "WK Autoloader {ver} verfügbar", "selfUpdateLater": "Später", "selfUpdating": "WK Autoloader {ver} wird an elfldr gesendet...", "selfUpdated": "WK Autoloader {ver} an elfldr (:9021) gesendet.", "selfUpdateOpened": "Download von WK Autoloader {ver} geöffnet.", "selfUpdateFail": "WK Autoloader-Update fehlgeschlagen: {msg}", "selfUpdateNoElfldr": "elfldr :9021 läuft nicht - zuerst Jailbreak starten", "selfUpdateAfterJb": "Update wird nach dem Jailbreak ausgeführt"}, "pt": {"language": "Idioma", "langSet": "Idioma: Português", "credit": "Criado por X-F1REBALL-X", "supportTitle": "FW suportados 1.00-5.50 / 7.00-13.60", "detecting": "Detectando console...", "consoleNotDetected": "Console não detectado", "fwChain": "PS5 FW {fw} · cadeia {chain}", "fwUnsupported": "PS5 FW {fw} · não suportado", "afterJb": "Após o jailbreak, abrir", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager em :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "Híbrido: abrir :1000 ou enviar ELF tip", "autoStartJb": "Iniciar jailbreak automaticamente", "startJailbreak": "Iniciar jailbreak", "cancel": "Cancelar", "choiceSaved": "A escolha é salva neste console", "elfLauncherPage": "Página do Elf Launcher", "jailbreakStarted": "Jailbreak iniciado", "jailbreakSuccess": "Jailbreak concluído com sucesso", "jailbreakFail": "Jailbreak falhou - reinicie o console", "jailbreakInProgress": "Jailbreak em andamento", "elapsed": "Decorrido {t}", "metaFwChain": "FW {fw} · cadeia {chain}", "metaFwUnsupported": "FW {fw} · não suportado", "startingIn": "Começa em {n}…", "starting": "Iniciando…", "pageNotOpen": "Página de {label} ainda não aberta - Tentar de novo abaixo", "jbOkNoAnswer": "JB OK. {label} não respondeu em :{port} a tempo.", "retrySendOpen": "Reenviar e abrir {label} (:{port})", "resending": "Reenviando...", "installing": "Instalando…", "installSuccess": "Atualizado com sucesso\nAbrindo WK Autoloader…", "update": "Atualizar", "selfUpdate": "WK Autoloader {ver} disponível", "selfUpdateLater": "Depois", "selfUpdating": "Enviando WK Autoloader {ver} para o elfldr...", "selfUpdated": "WK Autoloader {ver} enviado para o elfldr (:9021).", "selfUpdateOpened": "Download do WK Autoloader {ver} aberto.", "selfUpdateFail": "Falha ao atualizar o WK Autoloader: {msg}", "selfUpdateNoElfldr": "elfldr :9021 não está rodando - faça o jailbreak primeiro", "selfUpdateAfterJb": "A atualização será aplicada após o jailbreak"}, "ru": {"language": "Язык", "langSet": "Язык: Русский", "credit": "Автор: X-F1REBALL-X", "supportTitle": "Поддерживаемые FW 1.00-5.50 / 7.00-13.60", "detecting": "Определение консоли...", "consoleNotDetected": "Консоль не обнаружена", "fwChain": "PS5 FW {fw} · цепочка {chain}", "fwUnsupported": "PS5 FW {fw} · не поддерживается", "afterJb": "После джейлбрейка открыть", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager на :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "Гибрид: открыть :1000 или отправить tip ELF", "autoStartJb": "Автозапуск джейлбрейка", "startJailbreak": "Запустить джейлбрейк", "cancel": "Отмена", "choiceSaved": "Выбор сохраняется на этой консоли", "elfLauncherPage": "Страница Elf Launcher", "jailbreakStarted": "Джейлбрейк запущен", "jailbreakSuccess": "Джейлбрейк успешно завершён", "jailbreakFail": "Джейлбрейк не удался - перезагрузите консоль", "jailbreakInProgress": "Идёт джейлбрейк", "elapsed": "Прошло {t}", "metaFwChain": "FW {fw} · цепочка {chain}", "metaFwUnsupported": "FW {fw} · не поддерживается", "startingIn": "Старт через {n}…", "starting": "Запуск…", "pageNotOpen": "Страница {label} ещё не открыта - Повторите ниже", "jbOkNoAnswer": "JB OK. {label} не ответил на :{port} вовремя.", "retrySendOpen": "Повторно отправить и открыть {label} (:{port})", "resending": "Повторная отправка...", "installing": "Установка…", "installSuccess": "Успешно обновлено\nОткрытие WK Autoloader…", "update": "Обновить", "selfUpdate": "Доступен WK Autoloader {ver}", "selfUpdateLater": "Позже", "selfUpdating": "Отправка WK Autoloader {ver} в elfldr...", "selfUpdated": "WK Autoloader {ver} отправлен в elfldr (:9021).", "selfUpdateOpened": "Открыта загрузка WK Autoloader {ver}.", "selfUpdateFail": "Ошибка обновления WK Autoloader: {msg}", "selfUpdateNoElfldr": "elfldr :9021 не запущен - сначала сделайте джейлбрейк", "selfUpdateAfterJb": "Обновление применится после джейлбрейка"}, "ja": {"language": "言語", "langSet": "言語: 日本語", "credit": "制作: X-F1REBALL-X", "supportTitle": "対応 FW 1.00-5.50 / 7.00-13.60", "detecting": "本体を検出中...", "consoleNotDetected": "本体を検出できません", "fwChain": "PS5 FW {fw} · チェーン {chain}", "fwUnsupported": "PS5 FW {fw} · 非対応", "afterJb": "脱獄後に開く", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "ハイブリッド: :1000 を開くか tip ELF を送信", "autoStartJb": "脱獄を自動開始", "startJailbreak": "脱獄を開始", "cancel": "キャンセル", "choiceSaved": "選択はこの本体に保存されます", "elfLauncherPage": "Elf Launcher ページ", "jailbreakStarted": "脱獄を開始しました", "jailbreakSuccess": "脱獄が正常に完了しました", "jailbreakFail": "脱獄に失敗しました - 本体を再起動してください", "jailbreakInProgress": "脱獄の実行中", "elapsed": "経過 {t}", "metaFwChain": "FW {fw} · チェーン {chain}", "metaFwUnsupported": "FW {fw} · 非対応", "startingIn": "{n} 秒後に開始…", "starting": "開始中…", "pageNotOpen": "{label} のページはまだ開いていません - 下で再試行", "jbOkNoAnswer": "JB OK。{label} が :{port} に時間内に応答しませんでした。", "retrySendOpen": "再送信して {label} を開く (:{port})", "resending": "再送信中...", "installing": "インストール中…", "installSuccess": "更新に成功しました\nWK Autoloader を開いています…", "update": "更新", "selfUpdate": "WK Autoloader {ver} が利用可能です", "selfUpdateLater": "後で", "selfUpdating": "WK Autoloader {ver} を elfldr に送信中...", "selfUpdated": "WK Autoloader {ver} を elfldr (:9021) に送信しました。", "selfUpdateOpened": "WK Autoloader {ver} のダウンロードを開きました。", "selfUpdateFail": "WK Autoloader の更新に失敗しました: {msg}", "selfUpdateNoElfldr": "elfldr :9021 が動作していません - 先にジェイルブレイクしてください", "selfUpdateAfterJb": "ジェイルブレイク後に更新します"}, "zh": {"language": "语言", "langSet": "语言：中文", "credit": "作者：X-F1REBALL-X", "supportTitle": "支持固件 1.00-5.50 / 7.00-13.60", "detecting": "正在检测主机...", "consoleNotDetected": "未检测到主机", "fwChain": "PS5 FW {fw} · 链 {chain}", "fwUnsupported": "PS5 FW {fw} · 不支持", "afterJb": "越狱后打开", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager 端口 :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "混合：打开 :1000 或发送 tip ELF", "autoStartJb": "自动开始越狱", "startJailbreak": "开始越狱", "cancel": "取消", "choiceSaved": "选择会保存在本主机上", "elfLauncherPage": "Elf Launcher 页面", "jailbreakStarted": "已开始越狱", "jailbreakSuccess": "越狱成功完成", "jailbreakFail": "越狱失败 - 请重启主机", "jailbreakInProgress": "越狱进行中", "elapsed": "已用时 {t}", "metaFwChain": "FW {fw} · 链 {chain}", "metaFwUnsupported": "FW {fw} · 不支持", "startingIn": "{n} 秒后开始…", "starting": "正在开始…", "pageNotOpen": "{label} 页面尚未打开 - 请在下方重试", "jbOkNoAnswer": "越狱成功。{label} 未在时限内于 :{port} 响应。", "retrySendOpen": "重新发送并打开 {label} (:{port})", "resending": "正在重新发送...", "installing": "正在安装…", "installSuccess": "更新成功\n正在打开 WK Autoloader…", "update": "更新", "selfUpdate": "WK Autoloader {ver} 可用", "selfUpdateLater": "稍后", "selfUpdating": "正在将 WK Autoloader {ver} 发送到 elfldr...", "selfUpdated": "已将 WK Autoloader {ver} 发送到 elfldr (:9021)。", "selfUpdateOpened": "已打开 WK Autoloader {ver} 下载。", "selfUpdateFail": "WK Autoloader 更新失败：{msg}", "selfUpdateNoElfldr": "elfldr :9021 未运行 - 请先越狱", "selfUpdateAfterJb": "越狱后将执行更新"}, "it": {"language": "Lingua", "langSet": "Lingua: Italiano", "credit": "Creato da X-F1REBALL-X", "supportTitle": "FW supportati 1.00-5.50 / 7.00-13.60", "detecting": "Rilevamento console...", "consoleNotDetected": "Console non rilevata", "fwChain": "PS5 FW {fw} · catena {chain}", "fwUnsupported": "PS5 FW {fw} · non supportato", "afterJb": "Dopo il jailbreak, apri", "payloadManager": "Payload Manager", "payloadManagerDesc": "HTTP Manager su :8084", "elfLauncher": "Elf Launcher", "elfLauncherDesc": "Ibrido: apri :1000 o invia tip ELF", "autoStartJb": "Avvia jailbreak automaticamente", "startJailbreak": "Avvia jailbreak", "cancel": "Annulla", "choiceSaved": "La scelta viene salvata su questa console", "elfLauncherPage": "Pagina Elf Launcher", "jailbreakStarted": "Jailbreak avviato", "jailbreakSuccess": "Jailbreak completato con successo", "jailbreakFail": "Jailbreak non riuscito - riavvia la console", "jailbreakInProgress": "Jailbreak in corso", "elapsed": "Trascorso {t}", "metaFwChain": "FW {fw} · catena {chain}", "metaFwUnsupported": "FW {fw} · non supportato", "startingIn": "Parte tra {n}…", "starting": "Avvio…", "pageNotOpen": "Pagina {label} non ancora aperta - Riprova sotto", "jbOkNoAnswer": "JB OK. {label} non ha risposto su :{port} in tempo.", "retrySendOpen": "Reinvia e apri {label} (:{port})", "resending": "Reinvio...", "installing": "Installazione…", "installSuccess": "Aggiornato correttamente\nApertura di WK Autoloader…", "update": "Aggiorna", "selfUpdate": "WK Autoloader {ver} disponibile", "selfUpdateLater": "Più tardi", "selfUpdating": "Invio di WK Autoloader {ver} a elfldr...", "selfUpdated": "WK Autoloader {ver} inviato a elfldr (:9021).", "selfUpdateOpened": "Download di WK Autoloader {ver} aperto.", "selfUpdateFail": "Aggiornamento di WK Autoloader non riuscito: {msg}", "selfUpdateNoElfldr": "elfldr :9021 non è attivo - esegui prima il jailbreak", "selfUpdateAfterJb": "L'aggiornamento verrà eseguito dopo il jailbreak"}};

var LANG = 'en';
var LS_LANG_KEY = 'ps5elfs-lang'; /* shared with Elf Launcher on the same console */

function langInfo(code) {
  var i;
  for (i = 0; i < LANGS.length; i++) {
    if (LANGS[i].code === code) return LANGS[i];
  }
  return LANGS[0];
}

function t(key, vars) {
  var d = I18N[LANG] || I18N.en;
  var s = d[key];
  if (s == null) s = I18N.en[key];
  if (s == null) s = key;
  if (vars) {
    s = String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] != null ? String(vars[k]) : m;
    });
  }
  return s;
}

function readLang() {
  var v = '', m;
  try { v = localStorage.getItem(LS_LANG_KEY) || ''; } catch (e) { }
  if (!v) {
    try {
      m = document.cookie.match(/(?:^|; )ps5elfs-lang=([a-z]{2})/);
      if (m) v = m[1];
    } catch (e2) { }
  }
  if (v === 'he') v = 'en';
  return I18N[v] ? v : 'en';
}

function saveLang(code) {
  try { localStorage.setItem(LS_LANG_KEY, code); } catch (e) { }
  try { sessionStorage.setItem(LS_LANG_KEY, code); } catch (e2) { }
  try { document.cookie = 'ps5elfs-lang=' + code + '; path=/; max-age=31536000'; } catch (e3) { }
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyStaticI18n() {
  var info = langInfo(LANG);
  var nodes, i, k;
  var root = document.getElementById('launcherChoice') || document.getElementById('splash') || document.body;
  var fl = document.getElementById('langflag');
  var loader = document.getElementById('loader');
  try { document.documentElement.setAttribute('lang', LANG); } catch (e) { }
  if (root) {
    if (info.rtl) root.setAttribute('dir', 'rtl');
    else root.removeAttribute('dir');
  }
  if (loader) {
    if (info.rtl) loader.setAttribute('dir', 'rtl');
    else loader.removeAttribute('dir');
  }
  nodes = document.querySelectorAll('[data-i18n]');
  for (i = 0; i < nodes.length; i++) {
    k = nodes[i].getAttribute('data-i18n');
    if (!k) continue;
    if (nodes[i].getAttribute('data-i18n-html') === '1') {
      nodes[i].innerHTML = t(k).replace(/\n/g, '<br>');
    } else {
      nodes[i].textContent = t(k);
    }
  }
  if (fl) fl.innerHTML = FLAGS[info.flag] || '';
  renderLangList();
}

function renderLangList() {
  var box = document.getElementById('langlist');
  var html = '', i, L;
  if (!box) return;
  for (i = 0; i < LANGS.length; i++) {
    L = LANGS[i];
    html += '<button type="button" class="langopt" role="menuitem" data-lang="' + L.code
      + '" data-state="' + (L.code === LANG ? 'on' : 'off') + '"'
      + (L.rtl ? ' dir="rtl"' : '') + '><span class="flag">'
      + (FLAGS[L.flag] || '') + '</span><span>' + esc(L.name) + '</span></button>';
  }
  box.innerHTML = html;
  var opts = box.querySelectorAll('.langopt');
  for (i = 0; i < opts.length; i++) {
    opts[i].onclick = function () {
      setLang(this.getAttribute('data-lang'));
      toggleLangList(false);
      return false;
    };
  }
}

function toggleLangList(force) {
  var box = document.getElementById('langlist');
  var on;
  if (!box) return;
  on = (force === true || force === false) ? force : box.getAttribute('data-state') !== 'open';
  box.setAttribute('data-state', on ? 'open' : 'closed');
  box.className = on ? 'show' : '';
}

function setLang(code) {
  if (!I18N[code]) code = 'en';
  LANG = code;
  saveLang(code);
  applyStaticI18n();
  if (typeof global.wkalAfterLangChange === 'function') {
    try { global.wkalAfterLangChange(); } catch (e) { }
  }
}

function bindLangUi() {
  LANG = readLang();
  applyStaticI18n();
  var btn = document.getElementById('langbtn');
  if (btn) {
    btn.addEventListener('click', function (ev) {
      try { ev.stopPropagation(); } catch (e) { }
      toggleLangList();
      return false;
    });
  }
  document.addEventListener('click', function (ev) {
    var box = document.getElementById('langbox');
    var list = document.getElementById('langlist');
    if (!list || list.getAttribute('data-state') !== 'open') return;
    var n = ev.target;
    if (box && box.contains(n)) return;
    toggleLangList(false);
  });
}

global.WKAL_I18N = {
  LANGS: LANGS,
  I18N: I18N,
  t: t,
  setLang: setLang,
  readLang: readLang,
  applyStaticI18n: applyStaticI18n,
  bindLangUi: bindLangUi,
  langInfo: langInfo,
  getLang: function () { return LANG; }
};
global.t = t;
})(typeof window !== 'undefined' ? window : this);
