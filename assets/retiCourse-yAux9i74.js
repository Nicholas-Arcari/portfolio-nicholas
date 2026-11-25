import{_ as i,r as d}from"./index-BNvZxvwf.js";import"./university--XW6tAKw.js";const A="https://github.com/Nicholas-Arcari/laboratorio-reti-dei-calcolatori",u=[{slug:"esercizio-1",file:"01-docker.txt",name:"Esercizio #1 - docker",en:"Docker: fundamentals. Daemon, images, containers, nginx-ssh, namespaces, cgroups, overlay FS."},{slug:"esercizio-2",file:"02-netSniffing.txt",name:"Esercizio #2 - netSniffing",en:"Network sniffing. Docker volumes, tcpdump, Wireshark, TCP analysis, packet capture."},{slug:"esercizio-3",file:"03-ip-statico.txt",name:"Esercizio #3 - ip-statico",en:"Static IP and port forwarding. User-defined bridge, IPAM, DNAT, iptables NAT, compose.yml."},{slug:"esercizio-4",file:"04-routing.txt",name:"Esercizio #4 - routing",en:"Docker routing. Inter-VLAN routing, ip_forward, FIB, routing tables, privileged mode."},{slug:"esercizio-5",file:"05-programmazione-di-rete.txt",name:"Esercizio #5 - programmazione-di-rete",en:"Network programming. UDP/TCP sockets, gethostbyname, client-server, threading."},{slug:"esercizio-6",file:"06-http.txt",name:"Esercizio #6 - http",en:"HTTP and NGINX. Virtual hosting, NGINX configuration, CGI, PHP, event-driven model."},{slug:"esercizio-7",file:"07-firewall.txt",name:"Esercizio #7 - firewall",en:"Firewall with iptables. Netfilter, FORWARD chain, stateful inspection, conntrack, default deny."},{slug:"esercizio-8",file:"08-openSSL.txt",name:"Esercizio #8 - openSSL",en:"OpenSSL and cryptography. Base64, AES-256-CBC, MD5, HMAC-SHA256, RSA-2048, digital signatures."},{slug:"esercizio-9",file:"09-https.txt",name:"Esercizio #9 - https",en:"HTTPS and TLS. X.509 certificates, self-signed certificates, TLS handshake, SSL virtual hosts."},{slug:"esercizio-opzionale-ipv6",file:"opz-IPv6.txt",name:"Esercizio opzionale - IPv6",en:"IPv6. Global and link-local addresses, dual stack, NDP, EUI-64, nmap over IPv6."},{slug:"esercizio-opzionale-wifi",file:"opz-wifi.txt",name:"Esercizio opzionale - wifi",en:"WiFi. 802.11, WPA2, network scanning, wireless tcpdump, SSH between hosts."}],p=["e","cosi","bensi","cio","cioe","gia","piu","puo","pero","dara","esporra","fallira","potra","produrra","sara","verra","attivita","autenticita","confidenzialita","connettivita","difficolta","entita","estremita","funzionalita","identita","integrita","leggibilita","modalita","necessita","primalita","priorita","proprieta","quantita","raggiungibilita","realta","retrocompatibilita","univocita","universita","validita","velocita","visibilita","vulnerabilita"],m=["perche","poiche","affinche","anziche","ne","se"],f={a:"à",e:"è",i:"ì",o:"ò",u:"ù"},g=new Map([...p.map(e=>[e,e.slice(0,-1)+f[e.slice(-1)]]),...m.map(e=>[e,`${e.slice(0,-1)}é`])]),b=/(^|[^A-Za-zÀ-ÿ])([A-Za-z]+)'(?![A-Za-zÀ-ÿ])/g;function E(e){return e.replace(b,(t,o,n)=>{const a=g.get(n.toLowerCase());if(!a)return t;const _=n[0]===n[0].toUpperCase()?a[0].toUpperCase():a[0];return o+_+a.slice(1)})}const l=`# Laboratorio di Reti dei Calcolatori

\`\`\`
  _           _                     _             _
 | |         | |                   | |           (_)
 | |     __ _| |__   ___  _ __ __ _| |_ ___  _ __ _  ___
 | |    / _\` | '_ \\ / _ \\| '__/ _\` | __/ _ \\| '__| |/ _ \\
 | |___| (_| | |_) | (_) | | | (_| | || (_) | |  | | (_) |
 |______\\__,_|_.__/ \\___/|_|  \\__,_|\\__\\___/|_|  |_|\\___/

  ____      _   _     _      _    ____      _            _       _             _
 |  _ \\ ___| |_(_)   __| | ___(_)  / ___|__ _| | ___ ___ | | __ _| |_ ___  _ __(_)
 | |_) / _ \\ __| |  / _\` |/ _ \\ | | |   / _\` | |/ __/ _ \\| |/ _\` | __/ _ \\| '__| |
 |  _ <  __/ |_| | | (_| |  __/ | | |__| (_| | | (_| (_) | | (_| | || (_) | |  | |
 |_| \\_\\___|\\__|_|  \\__,_|\\___|_|  \\____\\__,_|_|\\___\\___/|_|\\__,_|\\__\\___/|_|  |_|
\`\`\`

**Corso**: Reti dei Calcolatori - A.A. 2024/2025  
**Docente**: Prof. Roberto Alfieri  
**Universita'**: Universita' degli Studi di Parma  
**Studente**: Arcari Nicholas  
**Ambiente**: Kali Linux

---

## Contenuto della Repository

Ogni file corrisponde a un'esercitazione di laboratorio, documentata con i comandi eseguiti, i relativi output e un'analisi tecnica a basso livello delle operazioni di rete e sicurezza coinvolte.

| # | File | Argomento | Temi chiave |
|---|------|-----------|-------------|
| 01 | [01-docker.txt](01-docker.txt) | Docker: fondamenti | Daemon, immagini, container, nginx-ssh, namespaces, cgroups, overlay FS |
| 02 | [02-netSniffing.txt](02-netSniffing.txt) | Network Sniffing | Volumi Docker, tcpdump, Wireshark, analisi TCP, cattura pacchetti |
| 03 | [03-ip-statico.txt](03-ip-statico.txt) | IP Statico e Port Forwarding | Bridge user-defined, IPAM, DNAT, iptables NAT, compose.yml |
| 04 | [04-routing.txt](04-routing.txt) | Docker Routing | Routing inter-VLAN, ip_forward, FIB, tabelle di routing, privileged mode |
| 05 | [05-programmazione-di-rete.txt](05-programmazione-di-rete.txt) | Programmazione di Rete | Socket UDP/TCP, gethostbyname, client-server, threading |
| 06 | [06-http.txt](06-http.txt) | HTTP e NGINX | Virtual hosting, configurazione NGINX, CGI, PHP, event-driven model |
| 07 | [07-firewall.txt](07-firewall.txt) | Firewall con iptables | Netfilter, chain FORWARD, stateful inspection, conntrack, default deny |
| 08 | [08-openSSL.txt](08-openSSL.txt) | OpenSSL e Crittografia | Base64, AES-256-CBC, MD5, HMAC-SHA256, RSA-2048, firma digitale |
| 09 | [09-https.txt](09-https.txt) | HTTPS e TLS | Certificati X.509, self-signed, TLS handshake, virtual host SSL |
| opz | [opz-IPv6.txt](opz-IPv6.txt) | IPv6 | Indirizzi Global/Link-Local, dual-stack, NDP, EUI-64, nmap IPv6 |
| opz | [opz-wifi.txt](opz-wifi.txt) | WiFi | 802.11, WPA2, scansione rete, tcpdump wireless, inter-host SSH |

---

## Stack Tecnologico

- **Container**: Docker Engine 20.10, Docker Compose v1/v2
- **Immagine base**: \`cyberteam1/nginx-ssh\` (NGINX + OpenSSH Server)
- **Networking**: Linux bridge, veth pairs, iptables/netfilter, IPv4/IPv6
- **Analisi di rete**: tcpdump, Wireshark, nmap, traceroute, dig, whois
- **Crittografia**: OpenSSL (AES-256-CBC, RSA-2048, SHA-256, HMAC, X.509)
- **Programmazione**: Python 3 (socket UDP/TCP, client-server, threading)
- **Web server**: NGINX (virtual hosting, SSL/TLS, reverse proxy)

---

## Topologia di Rete

Le esercitazioni costruiscono progressivamente topologie di rete Docker sempre piu' complesse:

\`\`\`
  Lab 01-02: Single bridge (default docker0)
  ┌──────────┐     ┌──────────┐
  │   ns2    │─────│   ns3    │   bridge: 172.17.0.0/16
  └──────────┘     └──────────┘

  Lab 03: Bridge user-defined con IP statico + port forwarding
  Host:2006 ──DNAT──> ns11:22    bridge1: 172.21.0.0/24
  Host:8006 ──DNAT──> ns11:80

  Lab 04: Inter-VLAN routing
  ┌──────┐         ┌──────┐         ┌──────┐
  │  ns8 │──bridge1──│  ns9 │──bridge2──│ ns10 │
  │.1.2  │  10.0.1.0 │.1.3  │  10.0.2.0 │.2.4  │
  └──────┘   /24    │.2.3  │   /24    └──────┘
                    └──────┘
                   (router)

  Lab 07: Firewall (iptables su ns3)
  ns2 ──[bridge1]──> ns3 (FORWARD rules) ──[bridge2]──> ns4
       10.0.1.0/24   firewall: DROP policy    10.0.2.0/24
                     ACCEPT: SSH(22), HTTP(80)
\`\`\`

---

## Analisi a Basso Livello

Ogni file include sezioni \`[Analisi a basso livello]\` che approfondiscono:

- **Kernel Linux**: namespaces (PID, NET, MNT, UTS, IPC), cgroups, ip_forward, FIB, netfilter
- **Protocolli di rete**: TCP three-way handshake, UDP datagrammi, ICMP, ARP/NDP, DNS, HTTP/HTTPS
- **Sicurezza**: cifratura simmetrica/asimmetrica, firme digitali, TLS handshake, certificate chain, iptables stateful filtering
- **Docker internals**: overlay filesystem, veth pairs, bridge networking, DNAT/SNAT, container isolation

---

## Come Utilizzare

\`\`\`bash
# Avviare Docker
sudo service docker start

# Esempio: laboratorio routing (Lab 04)
cd dockerRouting/
docker-compose up -d
docker exec -it ns8 bash
\`\`\`

---

## Note

- I file sono in formato \`.txt\` per compatibilita' con il server didattica-linux dell'universita'.
- Gli output dei comandi sono riportati fedelmente come eseguiti durante le sessioni di laboratorio.
- Le password e le matricole sono state sostituite con placeholder per sicurezza.
- Le catture di rete (.pcap) sono escluse dalla repository tramite \`.gitignore\`.
`,h=Object.assign({"./lab/01-docker.txt":()=>i(()=>import("./01-docker-BTIhxn-a.js"),[]).then(e=>e.default),"./lab/02-netSniffing.txt":()=>i(()=>import("./02-netSniffing-V-WtWyB8.js"),[]).then(e=>e.default),"./lab/03-ip-statico.txt":()=>i(()=>import("./03-ip-statico-DZujga9l.js"),[]).then(e=>e.default),"./lab/04-routing.txt":()=>i(()=>import("./04-routing-CjH_6AOV.js"),[]).then(e=>e.default),"./lab/05-programmazione-di-rete.txt":()=>i(()=>import("./05-programmazione-di-rete-DAnv3uER.js"),[]).then(e=>e.default),"./lab/06-http.txt":()=>i(()=>import("./06-http-BFPwOuYG.js"),[]).then(e=>e.default),"./lab/07-firewall.txt":()=>i(()=>import("./07-firewall-7o-lsy7Y.js"),[]).then(e=>e.default),"./lab/08-openSSL.txt":()=>i(()=>import("./08-openSSL-BF1Q3p0F.js"),[]).then(e=>e.default),"./lab/09-https.txt":()=>i(()=>import("./09-https-bypzvbJ6.js"),[]).then(e=>e.default),"./lab/opz-IPv6.txt":()=>i(()=>import("./opz-IPv6-oA0Zkhdb.js"),[]).then(e=>e.default),"./lab/opz-wifi.txt":()=>i(()=>import("./opz-wifi-BS6UUjH_.js"),[]).then(e=>e.default)}),T=Object.assign({"./doc/01-docker.lab":()=>i(()=>import("./01-docker-12MoyWbf.js"),[]).then(e=>e.default),"./doc/02-netSniffing.lab":()=>i(()=>import("./02-netSniffing-B-fuSRpw.js"),[]).then(e=>e.default),"./doc/03-ip-statico.lab":()=>i(()=>import("./03-ip-statico-CdOO76pd.js"),[]).then(e=>e.default),"./doc/04-routing.lab":()=>i(()=>import("./04-routing-Dp_TIOxC.js"),[]).then(e=>e.default),"./doc/05-programmazione-di-rete.lab":()=>i(()=>import("./05-programmazione-di-rete-pBSOr2rZ.js"),[]).then(e=>e.default),"./doc/06-http.lab":()=>i(()=>import("./06-http-CDXAN1CS.js"),[]).then(e=>e.default),"./doc/07-firewall.lab":()=>i(()=>import("./07-firewall-Bt0R3JhC.js"),[]).then(e=>e.default),"./doc/08-openSSL.lab":()=>i(()=>import("./08-openSSL-3TuZ0Jm8.js"),[]).then(e=>e.default),"./doc/09-https.lab":()=>i(()=>import("./09-https-7ZmzG3wd.js"),[]).then(e=>e.default),"./doc/opz-IPv6.lab":()=>i(()=>import("./opz-IPv6-CwznA6Ed.js"),[]).then(e=>e.default),"./doc/opz-wifi.lab":()=>i(()=>import("./opz-wifi-Rg9bKafk.js"),[]).then(e=>e.default)}),r=new Map,c=(e,t)=>(r.has(e)||r.set(e,t[e]()),r.get(e)),S=e=>c(`./lab/${e}`,h),D=e=>c(`./doc/${e.replace(/\.txt$/,".lab")}`,T),v=(()=>{const e={};for(const t of l.split(`
`)){const o=t.match(/^\|[^|]*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|([^|]*)\|([^|]*)\|\s*$/);o&&(e[o[1]]=`${o[2].trim()}. ${o[3].trim()}.`)}return e})(),z=(e,t)=>t==="en"?e.en:v[e.file]||"",L=e=>u.find(t=>t.file===e)||null,s=e=>e.trim().replace(/\n-{3,}$/,"").trim(),I=(()=>{const[e,...t]=l.split(/^(?=## )/m);return{intro:s(e),sections:t.map(o=>{const[n,...a]=o.split(`
`);return{title:n.replace(/^##\s+/,"").trim(),source:s(a.join(`
`))}})}})();d("reti",{it:{terminal:["> ./load_module.sh --reti","> Caricamento esercitazioni di laboratorio...","> Ambiente: Kali Linux","> Pronto."],exerciseTerminal:["> Ambiente: Kali Linux","> Pronto."],title:"Reti di Calcolatori - Laboratorio",subtitle:"Le esercitazioni di laboratorio del corso di Reti di Calcolatori, dal repository del laboratorio. Seleziona una riga per aprire l'esercitazione.",search:"Cerca un esercizio (es. firewall, Docker, TLS)...",colName:"Nome",colDescription:"Descrizione",noResults:"Nessun esercizio trovato.",course:"Reti di Calcolatori",sidebarCoursel:"Insegnamento:",sidebarDegreel:"Corso:",sidebarTeacherl:"Docente:",sidebarYearl:"Anno accademico:",sidebarBack:"Torna al piano di studi",sidebarBackDesc:"Tutti gli esami della laurea triennale.",sidebarBackBtn:"Piano di studi",repoTitle:"Il repository",repoText:"Tutti i file del laboratorio, con la loro storia, su GitHub.",fileTitle:"Il file dell'esercitazione",fileText:"Il testo originale, identico a quello del repository del laboratorio.",download:"Scarica il file .txt",github:"Vedi su GitHub",textNote:`Il testo è quello del file del laboratorio, impaginato: comandi e output nei riquadri scuri, file e schemi in quelli chiari, le analisi a basso livello nei riquadri con il bordo verde. Il file originale, così com'è, si scarica dal riquadro "Il file dell'esercitazione".`,colCommand:"Comando",colWhat:"Cosa fa",index:"Indice",indexTitle:"Indice dell'esercitazione",close:"Chiudi",backToList:"Tutti gli esercizi",backToTop:"Torna su",loading:"Caricamento..."},en:{terminal:["> ./load_module.sh --networks","> Loading lab exercises...","> Environment: Kali Linux","> Ready."],exerciseTerminal:["> Environment: Kali Linux","> Ready."],title:"Computer Networks - Lab",subtitle:"The lab exercises of the Computer Networks course, from the lab repository. Select a row to open the exercise.",search:"Search an exercise (e.g. firewall, Docker, TLS)...",colName:"Name",colDescription:"Description",noResults:"No exercise found.",course:"Computer Networks",sidebarCoursel:"Course:",sidebarDegreel:"Degree:",sidebarTeacherl:"Lecturer:",sidebarYearl:"Academic year:",sidebarBack:"Back to the study plan",sidebarBackDesc:"All the exams of the bachelor's degree.",sidebarBackBtn:"Study plan",repoTitle:"The repository",repoText:"All the lab files, with their history, on GitHub.",fileTitle:"The exercise file",fileText:"The original text, identical to the one in the lab repository.",download:"Download the .txt file",github:"View on GitHub",textNote:`The text is the lab file's own, in Italian, laid out: commands and their output in the dark boxes, files and diagrams in the light ones, the low-level analyses in the boxes with the green edge. The original file, as it is, can be downloaded from the "The exercise file" box.`,colCommand:"Command",colWhat:"What it does",index:"Contents",indexTitle:"Exercise contents",close:"Close",backToList:"All exercises",backToTop:"Back to top",loading:"Loading..."}});const k=e=>({summary:[[e("reti.sidebarCoursel"),e("reti.course")],[e("reti.sidebarDegreel"),e("university.sidebarCourse")],[e("reti.sidebarTeacherl"),"Prof. Roberto Alfieri"],[e("reti.sidebarYearl"),"2024/2025"]],back:{to:"/university-details",title:e("reti.sidebarBack"),desc:e("reti.sidebarBackDesc"),btn:e("reti.sidebarBackBtn")}});export{u as R,E as a,z as b,A as c,I as d,D as e,S as f,L as l,k as r};
