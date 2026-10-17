const n=`  _           _                     _             _                      ______      _
 | |         | |                   | |           (_)                    |  ____|    | |
 | |     __ _| |__   ___  _ __ __ _| |_ ___  _ __ _  ___      ______    | |__  __  _| |_ _ __ __ _
 | |    / _\` | '_ \\ / _ \\| '__/ _\` | __/ _ \\| '__| |/ _ \\    |______|   |  __| \\ \\/ / __| '__/ _\` |
 | |___| (_| | |_) | (_) | | | (_| | || (_) | |  | | (_) |              | |____ >  <| |_| | | (_| |
 |______\\__,_|_.__/ \\___/|_|  \\__,_|\\__\\___/|_|  |_|\\___/               |______/_/\\_\\\\__|_|  \\__,_|




	----------------------------------------
		+++++ Docker IPv6 +++++
	----------------------------------------


[Analisi a basso livello - Introduzione a IPv6]

  IPv6 (Internet Protocol version 6) e' il successore di IPv4, progettato per risolvere l'esaurimento
  degli indirizzi IPv4 (2^32 = ~4.3 miliardi) e introdurre miglioramenti architetturali.

  Caratteristiche principali:
  - Indirizzi a 128 bit: 2^128 = ~3.4 * 10^38 indirizzi possibili (340 undecilioni).
  - Notazione: 8 gruppi di 4 cifre esadecimali separati da ":" (es. 2001:0760:0000:0000:0000:0000:0000:0002).
  - Abbreviazioni: gruppi di soli zeri possono essere omessi con "::" (una sola volta per indirizzo).
    Esempio: 2001:0760::2 equivale a 2001:0760:0000:0000:0000:0000:0000:0002.
  - Nessun broadcast: IPv6 usa multicast (ff02::1 = all-nodes) e anycast al suo posto.
  - IPsec nativo: il supporto IPsec e' integrato nello standard (opzionale in IPv4).
  - Header semplificato: 40 byte fissi (vs 20-60 byte variabili in IPv4), velocizza il routing.

  Tipi di indirizzi IPv6:
  - ::1/128 = Loopback (equivalente a 127.0.0.1 in IPv4).
  - fe80::/10 = Link-Local (auto-configurati, validi solo sulla rete locale, non routabili).
  - 2000::/3 = Global Unicast (routabili su Internet, equivalenti agli IP pubblici IPv4).
  - fc00::/7 = Unique Local (equivalenti agli IP privati 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).
  - ff00::/8 = Multicast (sostituisce il broadcast IPv4).

[/Analisi]


> docker network create --ipv6 --subnet 2001:760::/112 ip6net
8b45ef6307e956d29d4b902bfcb364897ba0a6cffc8776741fe5aa96dd93a7df


> docker network ls
NETWORK ID     NAME      DRIVER    SCOPE
7fd3fe735a0a   bridge    bridge    local
8b45ef6307e9   ip6net    bridge    local


> docker network inspect ip6net
[
    {
        "Name": "ip6net",
        "Id": "8b45ef6307e956d29d4b902bfcb364897ba0a6cffc8776741fe5aa96dd93a7df",
        "Created": "2024-10-16T11:13:32.941826209+02:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": true,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "2001:760::/112"
                },
                {
                    "Subnet": "172.18.0.0/16",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {},
        "Options": {},
        "Labels": {}
    }
]


[Analisi a basso livello]

  Il flag --ipv6 crea un bridge dual-stack: ogni container riceve sia un indirizzo IPv4 che IPv6.

  Dalla configurazione IPAM si nota che Docker ha creato DUE subnet:
  1. IPv6: 2001:760::/112 -> pool di 2^(128-112) = 2^16 = 65536 indirizzi IPv6
     (simile a una /16 in IPv4). Docker assegna ::1 al gateway del bridge sull'host.
  2. IPv4: 172.18.0.0/16 -> pool di 2^16 - 2 = 65534 indirizzi IPv4 (aggiunta automaticamente
     da Docker poiche' ogni bridge necessita di connettivita' IPv4 per il funzionamento interno).
     Il gateway 172.18.0.1 e' l'indirizzo del bridge sull'host.

  Il driver "bridge" crea un Linux bridge con supporto IPv6 abilitato a livello kernel.
  Il kernel gestisce il routing IPv6 separatamente da IPv4, con tabelle di routing distinte
  (/proc/net/ipv6_route vs /proc/net/route).

  La subnet 2001:760::/112 usa il prefisso dell'Universita' di Parma (ASN del GARR, la rete
  accademica italiana). In un contesto Docker locale, questo prefisso non e' routabile su Internet
  (serve un accordo di peering con il provider e la configurazione del routing BGP).

[/Analisi]



	-----------------------------------------------------
		+++++ Docker IPv6 : comandi +++++
	-----------------------------------------------------

# La rete puo' essere associata ad un container, ad esempio:
> docker run -d --name ns62 --network ip6net cyberteam1/nginx-ssh
97fb1a387d51e7f8dc2f89d09cdac23c344ba6a03835192014766d24e57a9207


> docker run -d --name ns63 --network ip6net cyberteam1/nginx-ssh
97b477c163027cc1fdc668053c44907ba20e3dda88cd3daa8f8ff5e9d181fe6b


> docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED              STATUS              PORTS            NAMES
97b477c16302   cyberteam1/nginx-ssh   "/docker-entrypoint..."   55 seconds ago       Up 53 seconds       22/tcp, 80/tcp   ns63
97fb1a387d51   cyberteam1/nginx-ssh   "/docker-entrypoint..."   About a minute ago   Up About a minute   22/tcp, 80/tcp   ns62


> docker exec -it ns62 bash
root@97fb1a387d51:/#
root@97fb1a387d51:/#  ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
7: eth0@if8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:12:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.18.0.2/16 brd 172.18.255.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 2001:760::2/112 scope global nodad
       valid_lft forever preferred_lft forever
    inet6 fe80::42:acff:fe12:2/64 scope link
       valid_lft forever preferred_lft forever


[Analisi a basso livello]

  L'interfaccia eth0 del container ns62 ha TRE indirizzi IPv6 (e uno IPv4):

  1. ::1/128 (su lo) = Loopback IPv6, equivalente a 127.0.0.1.

  2. 2001:760::2/112 (scope global, flag nodad) = Global Unicast Address.
     - Assegnato dal IPAM di Docker, corrisponde al secondo indirizzo nella subnet /112.
     - "scope global" = indirizzo routabile (teoricamente raggiungibile da qualsiasi rete).
     - "nodad" = DAD (Duplicate Address Detection) disabilitato. Normalmente IPv6 invia un
       Neighbor Solicitation multicast prima di usare un indirizzo per verificare che non sia
       duplicato sulla rete. Docker lo disabilita per velocizzare l'avvio del container.

  3. fe80::42:acff:fe12:2/64 (scope link) = Link-Local Address.
     - Generato automaticamente dal kernel tramite il metodo EUI-64 modificato:
       a) Prende il MAC address: 02:42:ac:12:00:02
       b) Inserisce ff:fe nel mezzo: 02:42:ac:ff:fe:12:00:02
       c) Inverte il settimo bit (Universal/Local): 02 -> 00, quindi 00:42:ac:ff:fe:12:00:02
       d) Prefisso link-local fe80:: + suffisso EUI-64: fe80::42:acff:fe12:2
     - "scope link" = valido solo sulla rete locale, non routabile.
     - Usato per NDP (Neighbor Discovery Protocol), DHCPv6, e comunicazione prima dell'assegnazione
       di un indirizzo globale (SLAAC - Stateless Address Autoconfiguration).

  Il MAC address 02:42:ac:12:00:02:
  - 02:42 = OUI (Organizationally Unique Identifier) riservato da Docker per i container.
  - ac:12:00:02 = 172.18.0.2 in esadecimale (ac=172, 12=18, 00=0, 02=2). Docker codifica
    l'indirizzo IPv4 direttamente nei byte del MAC, rendendo la corrispondenza deterministica.

[/Analisi]


root@97fb1a387d51:/# nmap 172.18.0.0/29
Starting Nmap 7.93 ( https://nmap.org ) at 2024-10-16 09:21 UTC
Nmap scan report for 172.18.0.1
Host is up (0.000013s latency).
All 1000 scanned ports on 172.18.0.1 are in ignored states.
Not shown: 1000 closed tcp ports (reset)
MAC Address: 02:42:9C:1F:13:7B (Unknown)

Nmap scan report for ns63.ip6net (172.18.0.3)
Host is up (0.000019s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
MAC Address: 02:42:AC:12:00:03 (Unknown)

Nmap scan report for 97fb1a387d51 (172.18.0.2)
Host is up (0.0000080s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 8 IP addresses (3 hosts up) scanned in 1.91 seconds


root@97fb1a387d51:/# nmap -6 2001:760::/125
Starting Nmap 7.93 ( https://nmap.org ) at 2024-10-16 09:22 UTC
Nmap scan report for 2001:760::
Host is up (0.38s latency).
All 1000 scanned ports on 2001:760:: are in ignored states.
Not shown: 1000 filtered tcp ports (no-response)
MAC Address: 02:42:9C:1F:13:7B (Unknown)

Nmap scan report for 2001:760::1
Host is up (0.000028s latency).
All 1000 scanned ports on 2001:760::1 are in ignored states.
Not shown: 1000 closed tcp ports (reset)
MAC Address: 02:42:9C:1F:13:7B (Unknown)

Nmap scan report for ns63.ip6net (2001:760::3)
Host is up (0.00012s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
MAC Address: 02:42:AC:12:00:03 (Unknown)

Nmap scan report for 97fb1a387d51 (2001:760::2)
Host is up (0.000016s latency).
Not shown: 998 closed tcp ports (reset)
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 8 IP addresses (4 hosts up) scanned in 67.09 seconds
root@97fb1a387d51:/# exit
exit


[Analisi a basso livello]

  Confronto scansione IPv4 vs IPv6:

  nmap IPv4 (172.18.0.0/29 -> 8 indirizzi):
  - Host discovery via ARP (Address Resolution Protocol): invia ARP Request broadcast "who-has X?"
    sulla rete L2. Risposta immediata -> scansione veloce (1.91 secondi per 8 host).
  - 3 host trovati: gateway (172.18.0.1), ns63 (172.18.0.3), ns62 (172.18.0.2, se stesso).
  - Il gateway ha tutte le porte chiuse (RST): e' l'interfaccia del bridge sull'host, non ha servizi.

  nmap -6 IPv6 (2001:760::/125 -> 8 indirizzi):
  - Host discovery via ICMPv6 Neighbor Solicitation (equivalente IPv6 dell'ARP).
    MOLTO piu' lento: 67.09 secondi per 8 host.
  - Motivo della lentezza:
    a) NDP ha timeout piu' lunghi rispetto ad ARP.
    b) L'indirizzo 2001:760:: (all-zeros host part) ha 1000 porte "filtered" con 0.38s di latenza,
       indicando che le Neighbor Solicitation per quell'indirizzo ricevono risposta ma i pacchetti TCP
       vengono droppati silenziosamente (probabilmente un indirizzo assegnato al bridge ma filtrato).
  - 4 host trovati (uno in piu' rispetto a IPv4): 2001:760:: (bridge), ::1 (gateway), ::3 (ns63), ::2 (ns62).

  Nota: in ambienti reali, la scansione di intere subnet IPv6 e' impraticabile. Una /64 (la dimensione
  standard) ha 2^64 = ~1.8 * 10^19 indirizzi. Anche a 1 milione di probe al secondo, servirebbero
  ~585000 anni per scansionarli tutti. Questo e' un vantaggio di sicurezza intrinseco di IPv6.

[/Analisi]


> docker exec ns62 ping 172.18.0.3
PING 172.18.0.3 (172.18.0.3) 56(84) bytes of data.
64 bytes from 172.18.0.3: icmp_seq=1 ttl=64 time=0.084 ms
64 bytes from 172.18.0.3: icmp_seq=2 ttl=64 time=0.113 ms
64 bytes from 172.18.0.3: icmp_seq=3 ttl=64 time=0.116 ms
64 bytes from 172.18.0.3: icmp_seq=4 ttl=64 time=0.116 ms
64 bytes from 172.18.0.3: icmp_seq=5 ttl=64 time=0.115 ms
64 bytes from 172.18.0.3: icmp_seq=6 ttl=64 time=0.117 ms
64 bytes from 172.18.0.3: icmp_seq=7 ttl=64 time=0.113 ms
64 bytes from 172.18.0.3: icmp_seq=8 ttl=64 time=0.117 ms
^C


> docker exec ns62 ping6 2001:760::3
PING 2001:760::3(2001:760::3) 56 data bytes
64 bytes from 2001:760::3: icmp_seq=1 ttl=64 time=0.033 ms
64 bytes from 2001:760::3: icmp_seq=2 ttl=64 time=0.056 ms
64 bytes from 2001:760::3: icmp_seq=3 ttl=64 time=0.070 ms
64 bytes from 2001:760::3: icmp_seq=4 ttl=64 time=0.110 ms
64 bytes from 2001:760::3: icmp_seq=5 ttl=64 time=0.095 ms
64 bytes from 2001:760::3: icmp_seq=6 ttl=64 time=0.092 ms
64 bytes from 2001:760::3: icmp_seq=7 ttl=64 time=0.093 ms
^C


[Analisi a basso livello]

  Confronto ping IPv4 vs ping6 IPv6:

  ping IPv4 (ICMP Echo Request/Reply):
  - Usa il protocollo ICMP (tipo 8 = Echo Request, tipo 0 = Echo Reply) incapsulato in IP.
  - TTL=64: Hop Limit iniziale standard su Linux. I pacchetti arrivano con TTL invariato perche'
    ns62 e ns63 sono sullo stesso bridge (nessun hop intermedio).
  - RTT ~0.084-0.117 ms: latenza sub-millisecondo tipica di container sullo stesso host (comunicazione
    via bridge Linux in kernel space, nessun hardware fisico coinvolto).

  ping6 IPv6 (ICMPv6 Echo Request/Reply):
  - Usa ICMPv6 (tipo 128 = Echo Request, tipo 129 = Echo Reply) incapsulato in IPv6.
  - Primo pacchetto 0.033 ms (piu' veloce di IPv4): la risoluzione dell'indirizzo era gia' in cache
    NDP grazie alla scansione nmap precedente. I pacchetti successivi sono piu' lenti (~0.070-0.110 ms)
    a causa della varianza normale del kernel scheduler.
  - ping6 e' il comando legacy per ICMPv6. Nelle distribuzioni recenti, \`ping -6\` fa la stessa cosa.

  Differenze di protocollo ICMP vs ICMPv6:
  - ICMPv6 e' ESSENZIALE per IPv6 (non opzionale come ICMP in IPv4): gestisce NDP (risoluzione indirizzi),
    Router Advertisement, Path MTU Discovery, Multicast Listener Discovery.
  - NON si deve filtrare ICMPv6 sui firewall (errore comune che rompe la connettivita' IPv6).

[/Analisi]


> curl [2001:760::3]/index.nginx-debian.html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>


[Analisi a basso livello]

  curl [2001:760::3]/index.nginx-debian.html:
  - Le parentesi quadre [] sono NECESSARIE negli URL con indirizzi IPv6 per distinguere i ":" dell'indirizzo
    dal ":" che separa host e porta (RFC 3986). Senza parentesi, curl interpreterebbe "760::3" come porta.
  - La connessione TCP avviene sull'indirizzo IPv6 2001:760::3 porta 80 (default HTTP).
  - NGINX in ascolto su :::80 (wildcard IPv6) accetta connessioni sia IPv4 che IPv6 (dual-stack socket).
  - Il file index.nginx-debian.html e' la pagina di default di NGINX su Debian/Ubuntu.

[/Analisi]



	------------------------------------------------------------------
		+++++ Docker IPv6 : comandi con compose.yml +++++
	------------------------------------------------------------------

#dopo aver "personalizzato" il file compose.yml nella voce "volumes: ../Scrivania/RetiDeiCalcolatori/RETI2425/html:/var/www/html"
> docker-compose up -d
Creating ns62 ... done
Creating ns63 ... done


> docker-compose ps
Name              Command               State       Ports
--------------------------------------------------------------
ns62   /docker-entrypoint.sh ngin ...   Up      22/tcp, 80/tcp
ns63   /docker-entrypoint.sh ngin ...   Up      22/tcp, 80/tcp


[Analisi a basso livello]

  Il compose.yml per IPv6 definisce la rete con:
  - enable_ipv6: true -> abilita il supporto IPv6 sul bridge Docker.
  - subnet IPv6 specificata nel blocco ipam (es. 2001:760::/112).
  - Docker assegna automaticamente gli indirizzi IPv6 ai container in modo sequenziale (::62, ::63, ecc.)
    oppure e' possibile usare ipv6_address nella sezione networks del servizio per IP statici.

  La colonna State "Up" indica che i container sono in esecuzione. Le porte 22/tcp e 80/tcp
  sono esposte internamente ma non mappate sull'host (nessun port forwarding configurato nel compose).

[/Analisi]


# connessione ssh IPv6
> ssh ubuntu@2001:760::63
The authenticity of host '2001:760::63 (2001:760::63)' can't be established.
ED25519 key fingerprint is SHA256:LB3Ms/DT4dEpcYsnq3DdXfojqT08VDApPMh1fdmSV90.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '2001:760::63' (ED25519) to the list of known hosts.
ubuntu@2001:760::63's password:
Welcome to Ubuntu 23.04 (GNU/Linux 6.10.11-amd64 x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

ubuntu@ns63:~$exit
logout
Connection to 2001:760::63 closed.


[Analisi a basso livello]

  Connessione SSH su IPv6:
  - ssh ubuntu@2001:760::63: il client SSH risolve l'indirizzo IPv6 e apre una connessione TCP
    sulla porta 22 usando un socket AF_INET6.
  - Il fingerprint ED25519 (SHA256:LB3Ms/...) e' IDENTICO a quello visto nelle connessioni IPv4:
    la chiave host del server SSH e' la stessa indipendentemente dal protocollo di rete (L3).
    Questo conferma che IPv4 e IPv6 sono trasparenti rispetto ai livelli superiori (trasporto e applicazione).

  Sicurezza IPv6:
  - IPv6 NON e' intrinsecamente piu' sicuro di IPv4. Molti attacchi si applicano identicamente
    (port scanning, MITM, ARP spoofing -> NDP spoofing in IPv6).
  - Rischi specifici di IPv6:
    a) Router Advertisement spoofing: un attaccante puo' inviare RA fasulli per dirottare il traffico.
    b) NDP cache poisoning: equivalente dell'ARP spoofing, usa Neighbor Advertisement falsificati.
    c) Tunnel IPv6 non monitorato: se IPv6 e' abilitato ma non gestito, gli attaccanti possono usarlo
       per bypassare firewall configurati solo per IPv4.
  - Contromisure: RA Guard (RFC 6105), SEND (Secure NDP, RFC 3971), monitoraggio del traffico IPv6.

[/Analisi]
`;export{n as default};
