/* HFA · Selector de idioma (ES · EN · PT-BR · PT-PT)
   Traduce la interfaz en el navegador sin tocar los datos de los usuarios.
   Para añadir o corregir una traducción edita DICT (formato: español | inglés | portugués). */
(function () {
  'use strict';
  var LANGS = { es: 'Español', en: 'English', 'pt-BR': 'Português (Brasil)', 'pt-PT': 'Português (Portugal)' };
  var SHORT = { es: 'ES', en: 'EN', 'pt-BR': 'PT-BR', 'pt-PT': 'PT-PT' };

  var DICT = [
  // ---- menú y secciones ----
  'Inicio|Home|Início','Comunidad|Community|Comunidade','Clasificación|Standings|Classificação','Torneos|Tournaments|Torneios',
  'Estadísticas|Statistics|Estatísticas','Partidos|Matches|Partidas','Mis partidos|My matches|Meus jogos','📊 VER PREDICCIÓN|📊 VIEW PREDICTION|📊 VER PREVISÃO','📊 OCULTAR PREDICCIÓN|📊 HIDE PREDICTION|📊 OCULTAR PREVISÃO','Álbum|Album|Álbum','Cuenta|Account|Conta','Buzón|Inbox|Caixa de entrada',
  'Admin|Admin|Admin','Salir|Log out|Sair','Equipos|Teams|Times','Jugadores|Players|Jogadores','Noticias|News|Notícias','Palmarés|Honours|Palmarés',
  'Tema|Theme|Tema','Guía|Guide|Guia','Idioma|Language|Idioma','Menú|Menu|Menu','Menú principal|Main menu|Menu principal',
  'Menú Comunidad|Community menu|Menu da Comunidade','MENÚ DE COMUNIDAD|COMMUNITY MENU|MENU DA COMUNIDADE','Menú del panel|Panel menu|Menu do painel',
  'Mi cuenta|My account|Minha conta','Tu cuenta|Your account|Sua conta','Competición oficial|Official competition|Competição oficial',
  'Competición|Competition|Competição','Competición general|General competition|Competição geral','Sección|Section|Seção',
  '← Volver al inicio|← Back to home|← Voltar ao início','Atrás|Back|Voltar','Ir a Cuenta|Go to Account|Ir para Conta',
  'Habbo Fútbol Asociación|Habbo Football Association|Associação de Futebol Habbo','HABBO FÚTBOL ASOCIACIÓN|HABBO FOOTBALL ASSOCIATION|ASSOCIAÇÃO DE FUTEBOL HABBO',
  'Comunidad de rol futbolístico para Habbo.es|Football role-play community for Habbo.es|Comunidade de roleplay de futebol para o Habbo.es',
  'Acceso admins / árbitros|Admin / referee access|Acesso admins / árbitros','Ver partidos|View matches|Ver partidas',
  'Accesos rápidos|Quick links|Acessos rápidos','Portada de la liga|League front page|Capa da liga',
  // ---- acciones generales ----
  'Guardar cambios|Save changes|Salvar alterações','GUARDAR CAMBIOS|SAVE CHANGES|SALVAR ALTERAÇÕES','Guardar|Save|Salvar','Cancelar|Cancel|Cancelar','Cerrar|Close|Fechar',
  'Cerrar ✕|Close ✕|Fechar ✕','Cerrar sesión|Log out|Sair','Iniciar sesión|Log in|Entrar','Inicia sesión|Log in|Entre','Crear cuenta|Create account|Criar conta',
  'Contraseña|Password|Senha','Usuario|Username|Usuário','Eliminar|Delete|Excluir','Borrar|Delete|Apagar','Editar|Edit|Editar','Añadir|Add|Adicionar','Agregar|Add|Adicionar',
  'Buscar|Search|Buscar','Enviar|Send|Enviar','Aceptar|Accept|Aceitar','Rechazar|Decline|Recusar','Confirmar|Confirm|Confirmar','Continuar|Continue|Continuar',
  'Siguiente|Next|Próximo','Anterior|Previous|Anterior','Ver todo|View all|Ver tudo','Ver ficha →|View profile →|Ver ficha →','Ver jugadores|View players|Ver jogadores',
  'Ver resumen|View summary|Ver resumo','VER RESUMEN|VIEW SUMMARY|VER RESUMO','Ver contrato|View contract|Ver contrato','Ver presentes|View attendees|Ver presentes',
  'Ver divisiones|View divisions|Ver divisões','Ver en YouTube ↗|Watch on YouTube ↗|Ver no YouTube ↗','Acta →|Match report →|Súmula →','Anotar acta →|Fill match report →|Preencher súmula →',
  'Cargando|Loading|Carregando','Cargando…|Loading…|Carregando…','Comprobando…|Checking…|Verificando…','Actualizando...|Updating...|Atualizando...',
  'Actualizar y filtrar|Refresh and filter|Atualizar e filtrar','Sin datos|No data|Sem dados','Sin resultados|No results|Sem resultados','Todos|All|Todos','Ver todo|View all|Ver tudo',
  'Todas las divisiones|All divisions|Todas as divisões','Todas las jornadas|All matchdays|Todas as rodadas','Todos los torneos|All tournaments|Todos os torneios',
  'Todas las temporadas|All seasons|Todas as temporadas','Todos los partidos|All matches|Todas as partidas','Todos los países|All countries|Todos os países',
  // ---- estadísticas / jugadores ----
  'Goles|Goals|Gols','Asistencias|Assists|Assistências','Asistencia|Assist|Assistência','Tarjetas amarillas|Yellow cards|Cartões amarelos','Tarjeta amarilla|Yellow card|Cartão amarelo',
  'Tarjeta roja|Red card|Cartão vermelho','Tarjetas rojas|Red cards|Cartões vermelhos','Vallas invictas|Clean sheets|Jogos sem sofrer gols','Pases clave|Key passes|Passes decisivos',
  'Goles por partido|Goals per match|Gols por partida','Asistencias por partido|Assists per match|Assistências por partida','Gol en propia|Own goal|Gol contra',
  'Participación|Participation|Participação','Puntuación|Rating|Pontuação','Presión|Pressing|Pressão','Análisis|Analysis|Análise','MVPs|MVPs|MVPs','MVP del partido|Match MVP|MVP da partida',
  'Mención especial|Special mention|Menção especial','Balón de Oro|Ballon d\'Or|Bola de Ouro','Campeón|Champion|Campeão','Equipo campeón|Champion team|Time campeão',
  'Total de jugadores|Total players|Total de jogadores','Jugador registrado|Registered player|Jogador registrado','Jugadores registrados|Registered players|Jogadores registrados',
  'Sin jugadores|No players|Sem jogadores','Sin jugadores registrados|No registered players|Sem jogadores registrados','Sin equipo|No team|Sem time','Con equipo|With team|Com time',
  'Agente libre|Free agent|Agente livre','AGENTE LIBRE|FREE AGENT|AGENTE LIVRE','Posición|Position|Posição','Mis posiciones|My positions|Minhas posições','Sin posición|No position|Sem posição',
  'Portero (POR)|Goalkeeper (GK)|Goleiro (GOL)','Banda / ATK|Wing / ATK|Ala / ATK','EXTREMO/BANDA|WINGER|PONTA/ALA','Mejor BANDA|Best WING|Melhor ALA','Mejor MED|Best MID|Melhor MEI',
  'Comparar jugadores|Compare players|Comparar jogadores','Jugador 1|Player 1|Jogador 1','Jugador 2|Player 2|Jogador 2','Selecciona un jugador|Select a player|Selecione um jogador',
  'Selecciona jugador|Select player|Selecione jogador','Buscar jugador por nombre|Search player by name|Buscar jogador por nome','Buscar país...|Search country...|Buscar país...',
  'País|Country|País','Sin país seleccionado|No country selected|Nenhum país selecionado','Avatar de|Avatar of|Avatar de','Tu keko|Your keko|Seu keko',
  'Tu avatar de Habbo tal como lo verán los demás.|Your Habbo avatar as others will see it.|Seu avatar do Habbo como os outros o verão.',
  // ---- partidos / actas ----
  'Partidos y jornadas|Matches and matchdays|Partidas e rodadas','Jornadas y partidos|Matchdays and matches|Rodadas e partidas','Jornada|Matchday|Rodada','Jornada 1|Matchday 1|Rodada 1',
  'Nueva jornada|New matchday|Nova rodada','NUEVA JORNADA|NEW MATCHDAY|NOVA RODADA','Generar jornadas|Generate matchdays|Gerar rodadas','GENERAR JORNADAS|GENERATE MATCHDAYS|GERAR RODADAS',
  'Jornada actual|Current matchday|Rodada atual','Próximo partido|Next match|Próxima partida','Último partido|Last match|Última partida','Últimos resultados|Latest results|Últimos resultados',
  'Partidos finalizados|Finished matches|Partidas finalizadas','Sin partidos programados|No scheduled matches|Sem partidas programadas','Resumen del partido|Match summary|Resumo da partida',
  'Crónica del partido|Match report|Crônica da partida','Césped del partido|Match pitch|Gramado da partida','Alineación|Line-up|Escalação','Alineación inicial|Starting line-up|Escalação inicial',
  'Sin alineación registrada|No line-up registered|Sem escalação registrada','Predicción|Prediction|Previsão','Predicción de la comunidad|Community prediction|Previsão da comunidade',
  'Vota quién crees que ganará el partido.|Vote for who you think will win the match.|Vote em quem você acha que vai ganhar a partida.','FINALIZADO|FINISHED|FINALIZADA','Finalizado|Finished|Finalizada',
  'Local|Home|Mandante','Visitante|Away|Visitante','Empate|Draw|Empate','Equipo A|Team A|Time A','Equipo B|Team B|Time B','Fecha|Date|Data','Hora|Time|Hora',
  'Sin fecha|No date|Sem data','Sin goles registrados|No goals recorded|Sem gols registrados','Sin goles registrados.|No goals recorded.|Sem gols registrados.','Sin eventos registrados.|No events recorded.|Sem eventos registrados.',
  'Sin comentarios registrados.|No comments recorded.|Sem comentários registrados.','Sin premios registrados.|No awards recorded.|Sem prêmios registrados.',
  'Editar acta|Edit match report|Editar súmula','Guardar acta|Save match report|Salvar súmula','Acta guardada ✓|Match report saved ✓|Súmula salva ✓','Borrar acta|Delete match report|Apagar súmula',
  'BORRAR ACTA|DELETE MATCH REPORT|APAGAR SÚMULA','Finalizar acta|Finalise match report|Finalizar súmula','FINALIZAR ACTA|FINALISE MATCH REPORT|FINALIZAR SÚMULA',
  'Editar y finalizar acta|Edit and finalise match report|Editar e finalizar súmula','Editar y finalizar actas|Edit and finalise match reports|Editar e finalizar súmulas',
  'Registrar resultados|Record results|Registrar resultados','Registrar o editar resultado|Record or edit result|Registrar ou editar resultado','Resultado registrado|Result recorded|Resultado registrado',
  'Registrar / editar resultado|Record / edit result|Registrar / editar resultado','Registrar / finalizar acta|Record / finalise match report|Registrar / finalizar súmula',
  'Registrar o finalizar acta|Record or finalise match report|Registrar ou finalizar súmula','Añadir gol|Add goal|Adicionar gol','+ Añadir gol|+ Add goal|+ Adicionar gol','Guardar gol|Save goal|Salvar gol',
  '+ Añadir tarjeta|+ Add card|+ Adicionar cartão','Guardar tarjeta|Save card|Salvar cartão','+ Añadir cambio|+ Add substitution|+ Adicionar substituição','Añadir cambio|Add substitution|Adicionar substituição',
  'Guardar cambio|Save substitution|Salvar substituição','+ Añadir jugador|+ Add player|+ Adicionar jogador','Añadir al campo|Add to the pitch|Adicionar ao campo','Añadir partido|Add match|Adicionar partida',
  'AÑADIR PARTIDO|ADD MATCH|ADICIONAR PARTIDA','CREAR PARTIDO|CREATE MATCH|CRIAR PARTIDA','Editar partido|Edit match|Editar partida','Eliminar partido|Delete match|Excluir partida',
  'Gestión de partidos|Match management|Gestão de partidas','Lista de partidos|Match list|Lista de partidas','Filtros de partidos|Match filters|Filtros de partidas','Selecciona el partido|Select the match|Selecione a partida',
  '— Selecciona un partido —|— Select a match —|— Selecione uma partida —','Selecciona un partido.|Select a match.|Selecione uma partida.','Goles (minuto manual)|Goals (manual minute)|Gols (minuto manual)',
  'Asistencia (opcional)|Assist (optional)|Assistência (opcional)','Sin asistencia|No assist|Sem assistência','Confirmar MVP|Confirm MVP|Confirmar MVP','Confirmar mención|Confirm mention|Confirmar menção',
  'Añadir mención especial|Add special mention|Adicionar menção especial','Dar presente|Mark present|Marcar presença','Presentes por partido|Attendance per match|Presenças por partida','Guardar asistencia|Save attendance|Salvar presença',
  'Todavía nadie ha dado presente.|Nobody has marked attendance yet.|Ninguém marcou presença ainda.','Enlace de YouTube del resumen|Summary YouTube link|Link do YouTube do resumo',
  'Enlace de YouTube del resumen (opcional)|Summary YouTube link (optional)|Link do YouTube do resumo (opcional)','Tabla de posiciones|League table|Tabela de classificação',
  'Temporada actual|Current season|Temporada atual','Temporadas y torneos|Seasons and tournaments|Temporadas e torneios','Torneo activo|Active tournament|Torneio ativo','Torneo actual|Current tournament|Torneio atual',
  'Torneos existentes|Existing tournaments|Torneios existentes','Crear torneo|Create tournament|Criar torneio','Crear torneo nuevo|Create new tournament|Criar novo torneio','Crear y administrar torneos|Create and manage tournaments|Criar e gerenciar torneios',
  'Usar torneo seleccionado|Use selected tournament|Usar torneio selecionado','Sin torneo seleccionado|No tournament selected|Nenhum torneio selecionado','Nombre de la liga o copa|League or cup name|Nome da liga ou copa',
  // ---- equipos / divisiones ----
  'División|Division|Divisão','División 1|Division 1|Divisão 1','División 2|Division 2|Divisão 2','División 3|Division 3|Divisão 3','División 4|Division 4|Divisão 4','Divisiones asignadas|Assigned divisions|Divisões atribuídas',
  'Divisiones habilitadas|Enabled divisions|Divisões habilitadas','Sin división|No division|Sem divisão','Sin división asignada|No division assigned|Nenhuma divisão atribuída','Equipos por división|Teams by division|Times por divisão',
  'Equipos de la división|Division teams|Times da divisão','Equipos registrados|Registered teams|Times registrados','Equipos y jugadores|Teams and players|Times e jogadores','Agregar equipo|Add team|Adicionar time',
  'Añadir equipo|Add team|Adicionar time','Agregar equipo y jugadores|Add team and players|Adicionar time e jogadores','Eliminar equipo|Delete team|Excluir time','Nombre del equipo|Team name|Nome do time',
  'Escribe el nombre del equipo.|Enter the team name.|Digite o nome do time.','Dueño|Owner|Dono','Dueño de equipo|Team owner|Dono do time','Dueño del equipo|Team owner|Dono do time','Asignar dueño|Assign owner|Atribuir dono',
  'Asignar dueño de equipo|Assign team owner|Atribuir dono do time','Pulsa un equipo para ver su plantilla.|Tap a team to see its squad.|Toque em um time para ver o elenco.','Ver jugadores de un equipo|View a team\'s players|Ver jogadores de um time',
  'Este equipo todavía no tiene jugadores registrados.|This team has no registered players yet.|Este time ainda não tem jogadores registrados.','Buscar equipo para su escudo|Search team for its crest|Buscar time para o escudo',
  'Buscar escudo|Search crest|Buscar escudo','Escudo HFA|HFA crest|Escudo HFA','Escudo seleccionado:|Selected crest:|Escudo selecionado:','Subir escudo desde el PC|Upload crest from PC|Enviar escudo do PC',
  'URL del escudo (opcional)|Crest URL (optional)|URL do escudo (opcional)','Máximo 4 jugadores por equipo: 1 GK, 2 BANDA y 1 MED.|Maximum 4 players per team: 1 GK, 2 WING and 1 MID.|Máximo de 4 jogadores por time: 1 GOL, 2 ALA e 1 MEI.',
  'Aún no hay equipos.|There are no teams yet.|Ainda não há times.','Aún no hay equipos en esta división.|There are no teams in this division yet.|Ainda não há times nesta divisão.','No hay equipos|No teams|Sem times',
  'No hay equipos en esta división|No teams in this division|Sem times nesta divisão','Aún no hay partidos.|There are no matches yet.|Ainda não há partidas.','No hay partidos creados.|No matches created.|Nenhuma partida criada.',
  'No hay partidos en esta división|No matches in this division|Sem partidas nesta divisão','No hay torneos|No tournaments|Sem torneios','No hay torneos creados|No tournaments created|Nenhum torneio criado',
  'Todavía no hay torneos.|There are no tournaments yet.|Ainda não há torneios.','Todavía no hay torneos creados.|No tournaments have been created yet.|Nenhum torneio foi criado ainda.',
  'No hay jugadores registrados|No registered players|Sem jogadores registrados','No hay jugadores con esos filtros.|No players match those filters.|Nenhum jogador com esses filtros.',
  'Aún no hay datos registrados en esta división.|No data recorded in this division yet.|Ainda não há dados registrados nesta divisão.','Todavía no hay goles registrados.|No goals recorded yet.|Ainda não há gols registrados.',
  'Todavía no hay tarjetas registradas.|No cards recorded yet.|Ainda não há cartões registrados.','Todavía no hay menciones especiales.|No special mentions yet.|Ainda não há menções especiais.',
  'Todavía no hay partidos finalizados para mostrar palmarés.|No finished matches yet to show honours.|Ainda não há partidas finalizadas para mostrar o palmarés.',
  'Aún no hay partidos finalizados para mostrar progreso.|No finished matches yet to show progress.|Ainda não há partidas finalizadas para mostrar progresso.',
  // ---- palmarés / noticias / sponsors ----
  'Palmarés y reconocimientos|Honours and awards|Palmarés e reconhecimentos','Palmarés, noticias y patrocinadores|Honours, news and sponsors|Palmarés, notícias e patrocinadores','Palmarés y noticias|Honours and news|Palmarés e notícias',
  'Agregar al palmarés|Add to honours|Adicionar ao palmarés','Publicar noticia|Publish news|Publicar notícia','Aún no hay noticias publicadas|No news published yet|Ainda não há notícias publicadas',
  'Todavía no hay noticias publicadas.|No news published yet.|Ainda não há notícias publicadas.','No hay noticias agregadas.|No news added.|Nenhuma notícia adicionada.','No hay reconocimientos agregados.|No awards added.|Nenhum reconhecimento adicionado.',
  'Nombre de la noticia|News title|Título da notícia','Descripción de la noticia|News description|Descrição da notícia','Siguiente noticia|Next news item|Próxima notícia','Patrocinadores|Sponsors|Patrocinadores',
  'Agregar sponsor|Add sponsor|Adicionar patrocinador','Tu marca aquí|Your brand here|Sua marca aqui','Ofertas de la asociación|Association offers|Ofertas da associação','Notificaciones recientes|Recent notifications|Notificações recentes',
  'Abrir notificaciones|Open notifications|Abrir notificações','Cinta de novedades|News ticker|Faixa de novidades','Novedad de juegos|Games update|Novidade de jogos',
  // ---- cuenta / contratos / sesión ----
  'Cambiar contraseña|Change password|Alterar senha','🔑 Cambiar contraseña|🔑 Change password|🔑 Alterar senha','Contraseña actual|Current password|Senha atual','Nueva contraseña|New password|Nova senha',
  'Repite la nueva contraseña|Repeat the new password|Repita a nova senha','Guardar contraseña|Save password|Salvar senha','Contraseña cambiada|Password changed|Senha alterada','Contraseña incorrecta.|Incorrect password.|Senha incorreta.',
  'Las contraseñas no coinciden.|Passwords do not match.|As senhas não coincidem.','Las contraseñas nuevas no coinciden.|The new passwords do not match.|As novas senhas não coincidem.',
  'La contraseña debe tener al menos 6 caracteres.|The password must be at least 6 characters long.|A senha deve ter pelo menos 6 caracteres.','La contraseña actual no es correcta.|The current password is not correct.|A senha atual não está correta.',
  'La nueva contraseña debe ser distinta de la actual.|The new password must be different from the current one.|A nova senha deve ser diferente da atual.',
  'La nueva contraseña debe tener al menos 6 caracteres.|The new password must be at least 6 characters long.|A nova senha deve ter pelo menos 6 caracteres.',
  'Completa usuario y contraseña.|Enter your username and password.|Preencha usuário e senha.','Rellena los tres campos.|Fill in all three fields.|Preencha os três campos.',
  '¿Olvidaste tu contraseña?|Forgot your password?|Esqueceu sua senha?','Hola, he olvidado mi contraseña|Hi, I forgot my password|Olá, esqueci minha senha','Restablecer contraseña|Reset password|Redefinir senha',
  'Inicia sesión para consultar tu buzón de contratos.|Log in to check your contract inbox.|Entre para consultar sua caixa de contratos.','Inicia sesión para enviar una oferta.|Log in to send an offer.|Entre para enviar uma oferta.',
  'Ese nombre ya está registrado. Inicia sesión.|That name is already registered. Log in.|Esse nome já está registrado. Entre.','Ese usuario ya está registrado, inicia sesión.|That user is already registered, log in.|Esse usuário já está registrado, entre.',
  'No existe esa cuenta. Regístrate primero.|That account does not exist. Register first.|Essa conta não existe. Registre-se primeiro.','No encontramos tu cuenta. Vuelve a iniciar sesión.|We could not find your account. Log in again.|Não encontramos sua conta. Entre novamente.',
  'Selecciona un país al crear la cuenta.|Select a country when creating the account.|Selecione um país ao criar a conta.','Elige un país para completar tu perfil.|Choose a country to complete your profile.|Escolha um país para completar seu perfil.',
  'CUENTA CREADA EXITOSAMENTE|ACCOUNT CREATED SUCCESSFULLY|CONTA CRIADA COM SUCESSO','INICIO DE SESIÓN CONFIRMADO|LOGIN CONFIRMED|LOGIN CONFIRMADO','Usuario de Habbo.es|Habbo.es username|Usuário do Habbo.es',
  'Tu perfil: avatar, posición, país y datos de juego.|Your profile: avatar, position, country and gameplay data.|Seu perfil: avatar, posição, país e dados de jogo.','Tu colección de cromos y recuerdos de la liga.|Your collection of cards and league memories.|Sua coleção de cards e lembranças da liga.',
  'Consulta tu estado y tus contratos disponibles|Check your status and available contracts|Consulte seu status e contratos disponíveis','Ver tu estado y tus contratos disponibles|View your status and available contracts|Ver seu status e contratos disponíveis',
  'Revisa, firma o rechaza tus ofertas de contrato.|Review, sign or decline your contract offers.|Revise, assine ou recuse suas ofertas de contrato.','Aquí llegan las ofertas de equipos y los avisos para ti.|Team offers and notices for you arrive here.|As ofertas de times e avisos para você chegam aqui.',
  'No tienes contratos pendientes.|You have no pending contracts.|Você não tem contratos pendentes.','No tienes un equipo asignado.|You have no team assigned.|Você não tem um time atribuído.','Oferta de contrato|Contract offer|Oferta de contrato',
  'OFERTA DE CONTRATO|CONTRACT OFFER|OFERTA DE CONTRATO','CONTRATO DE FICHAJE|SIGNING CONTRACT|CONTRATO DE CONTRATAÇÃO','ACEPTAR Y FIRMAR|ACCEPT AND SIGN|ACEITAR E ASSINAR','Firma del dueño|Owner signature|Assinatura do dono',
  'Firma del jugador|Player signature|Assinatura do jogador','Enviar oferta|Send offer|Enviar oferta','Mandar oferta|Send offer|Enviar oferta','Oferta enviada|Offer sent|Oferta enviada','Contrato pendiente de condiciones|Contract pending terms|Contrato pendente de condições',
  'Ya tienes una oferta pendiente para este jugador.|You already have a pending offer for this player.|Você já tem uma oferta pendente para este jogador.','Este jugador ya pertenece a un equipo.|This player already belongs to a team.|Este jogador já pertence a um time.',
  'Solo los dueños de equipo pueden enviar ofertas.|Only team owners can send offers.|Apenas donos de time podem enviar ofertas.','Solo los dueños de equipos pueden enviar ofertas.|Only team owners can send offers.|Apenas donos de time podem enviar ofertas.',
  'Busca jugadores de tu equipo y envíales ofertas de contrato.|Find players for your team and send them contract offers.|Busque jogadores para o seu time e envie ofertas de contrato.',
  // ---- panel admin ----
  'Panel de administración|Administration panel|Painel de administração','Tutorial del panel de administración|Administration panel tutorial|Tutorial do painel de administração','📘 Tutorial del panel|📘 Panel tutorial|📘 Tutorial do painel','Tutorial completo|Full tutorial|Tutorial completo',
  'Cerrar tutorial|Close tutorial|Fechar tutorial','Gestiona divisiones, equipos, partidos y actas desde el área privada.|Manage divisions, teams, matches and match reports from the private area.|Gerencie divisões, times, partidas e súmulas pela área privada.',
  'Necesitas iniciar sesión como administrador.|You need to log in as an administrator.|Você precisa entrar como administrador.','Acceso administrador|Administrator access|Acesso de administrador','Acceso solo para administradores.|Access for administrators only.|Acesso somente para administradores.',
  '🔒 El panel de administración es privado.|🔒 The administration panel is private.|🔒 O painel de administração é privado.','Usuarios y divisiones|Users and divisions|Usuários e divisões','Usuarios y roles|Users and roles|Usuários e funções','Usuarios registrados y divisiones|Registered users and divisions|Usuários registrados e divisões',
  'Roles|Roles|Funções','Rol:|Role:|Função:','Sin rol|No role|Sem função','Sin rol asignado|No role assigned|Nenhuma função atribuída','Árbitro|Referee|Árbitro','Árbitro · Resultados|Referee · Results|Árbitro · Resultados','Moderación|Moderation|Moderação',
  'Moderador · IP y resultados|Moderator · IP and results|Moderador · IP e resultados','Prueba moderador|Trial moderator|Moderador em teste','ADMIN · Acceso total|ADMIN · Full access|ADMIN · Acesso total','Administra únicamente el rol de cada cuenta.|Manage only the role of each account.|Gerencie apenas a função de cada conta.',
  'Administra el rol de cada cuenta y su acceso deportivo por divisiones.|Manage each account\'s role and sporting access by division.|Gerencie a função de cada conta e o acesso esportivo por divisões.','Asignación deportiva|Sporting assignment|Atribuição esportiva',
  'Guardar divisiones|Save divisions|Salvar divisões','Divisiones guardadas ✓|Divisions saved ✓|Divisões salvas ✓','Divisiones guardadas correctamente.|Divisions saved successfully.|Divisões salvas com sucesso.','Selecciona una cuenta|Select an account|Selecione uma conta',
  'Buscar usuario|Search user|Buscar usuário','Buscar usuario por nombre|Search user by name|Buscar usuário por nome','Buscar usuario o dirección IP|Search user or IP address|Buscar usuário ou endereço IP','Aún no hay cuentas registradas.|No accounts registered yet.|Ainda não há contas registradas.',
  'Todavía no hay usuarios registrados.|No users registered yet.|Ainda não há usuários registrados.','Direcciones IP|IP addresses|Endereços IP','Solo IP compartidas|Shared IPs only|Apenas IPs compartilhados','IP de registro:|Registration IP:|IP de registro:','Última IP:|Last IP:|Último IP:',
  'IP distinta a la de registro|IP different from registration|IP diferente do registro','⚠ Misma IP que:|⚠ Same IP as:|⚠ Mesmo IP que:','Conexión normal|Normal connection|Conexão normal','Sin ExitLag ni VPN|No ExitLag or VPN|Sem ExitLag nem VPN',
  'Uso ExitLag para jugar|I use ExitLag to play|Uso ExitLag para jogar','Uso una VPN para jugar|I use a VPN to play|Uso uma VPN para jogar','Solo con VPN / ExitLag|Only with VPN / ExitLag|Somente com VPN / ExitLag','Último registro|Last record|Último registro','Sin registro|No record|Sem registro',
  'Modo mantenimiento|Maintenance mode|Modo de manutenção','🛠️ Modo mantenimiento|🛠️ Maintenance mode|🛠️ Modo de manutenção','Activar modo mantenimiento|Enable maintenance mode|Ativar modo de manutenção','Desactivar mantenimiento|Disable maintenance|Desativar manutenção',
  'Mensaje para los usuarios (opcional)|Message for users (optional)|Mensagem para os usuários (opcional)','Estamos en|We are in|Estamos em','ESTAMOS EN MANTENIMIENTO|WE ARE UNDER MAINTENANCE|ESTAMOS EM MANUTENÇÃO','Estamos en mantenimiento|We are under maintenance|Estamos em manutenção',
  '🟢 Desactivado · la web es visible para todos|🟢 Disabled · the site is visible to everyone|🟢 Desativado · o site é visível para todos','🔴 ACTIVO · solo los administradores ven la web|🔴 ACTIVE · only administrators can see the site|🔴 ATIVO · somente administradores veem o site',
  '🛠️ Modo mantenimiento ACTIVO · solo los admins ven la web|🛠️ Maintenance mode ACTIVE · only admins can see the site|🛠️ Modo de manutenção ATIVO · somente admins veem o site','Cargando estado…|Loading status…|Carregando status…',
  'Copia de seguridad|Backup|Cópia de segurança','Copias de seguridad|Backups|Cópias de segurança','🛡️ Copia de seguridad|🛡️ Backup|🛡️ Cópia de segurança','🛡️ Copias de seguridad|🛡️ Backups|🛡️ Cópias de segurança','🛡️ Abrir copias de seguridad|🛡️ Open backups|🛡️ Abrir cópias de segurança',
  'Guardar copia ahora|Save backup now|Salvar cópia agora','Copia manual|Manual backup|Cópia manual','En el servidor|On the server|No servidor','En tu ordenador|On your computer|No seu computador','Restaurar|Restore|Restaurar','Descargar|Download|Baixar',
  'Cargando copias…|Loading backups…|Carregando cópias…','Preparando copia…|Preparing backup…|Preparando cópia…','Guardando copia en el servidor…|Saving backup on the server…|Salvando cópia no servidor…','Aún no hay copias guardadas en el servidor.|No backups saved on the server yet.|Ainda não há cópias salvas no servidor.',
  '✔ Copia guardada en el servidor.|✔ Backup saved on the server.|✔ Cópia salva no servidor.','✔ Copia descargada. Guárdala en un lugar seguro.|✔ Backup downloaded. Keep it somewhere safe.|✔ Cópia baixada. Guarde em um lugar seguro.','Restaurando… no cierres la página.|Restoring… do not close the page.|Restaurando… não feche a página.',
  '¿Borrar esta copia del servidor?|Delete this backup from the server?|Apagar esta cópia do servidor?','El archivo no es una copia de HFA.|The file is not an HFA backup.|O arquivo não é uma cópia do HFA.','El archivo no es una copia válida.|The file is not a valid backup.|O arquivo não é uma cópia válida.',
  'Solo administradores. Incluye partidos, equipos, cuentas y roles.|Administrators only. Includes matches, teams, accounts and roles.|Somente administradores. Inclui partidas, times, contas e funções.','Aún no hay copias guardadas.|No backups saved yet.|Ainda não há cópias salvas.',
  '¿Eliminar este gol del acta?|Delete this goal from the match report?|Excluir este gol da súmula?','¿Eliminar todos los datos de esta acta?|Delete all data from this match report?|Excluir todos os dados desta súmula?',
  'No se pudo conectar con el servidor.|Could not connect to the server.|Não foi possível conectar ao servidor.','No se pudo conectar. Inténtalo de nuevo.|Could not connect. Please try again.|Não foi possível conectar. Tente novamente.',
  // ---- apariencia ----
  'Cambiar apariencia|Change appearance|Alterar aparência','Apariencia|Appearance|Aparência','Oscuro (verde)|Dark (green)|Escuro (verde)','Claro azul|Light blue|Azul claro','Claro cálido|Warm light|Claro quente','Medianoche (negro)|Midnight (black)|Meia-noite (preto)','Índigo|Indigo|Índigo',
  'Ver la guía de esta sección|View this section\'s guide|Ver o guia desta seção','❔ Guía|❔ Guide|❔ Guia','🎨 Tema|🎨 Theme|🎨 Tema','Tutorial|Tutorial|Tutorial','Omitir|Skip|Pular','Entendido|Got it|Entendi',
  // ---- pie ----
  'Comunidad de rol futbolístico independiente para Habbo.es.|Independent football role-play community for Habbo.es.|Comunidade independente de roleplay de futebol para o Habbo.es.',
  'No está afiliada, patrocinada ni respaldada por Sulake Corporation ni por Habbo|It is not affiliated with, sponsored by or endorsed by Sulake Corporation or Habbo|Não é afiliada, patrocinada nem endossada pela Sulake Corporation nem pelo Habbo',
  'No está afiliada, patrocinada ni respaldada por Sulake Corporation ni por Habbo,|It is not affiliated with, sponsored by or endorsed by Sulake Corporation or Habbo.|Não é afiliada, patrocinada nem endossada pela Sulake Corporation nem pelo Habbo.',
  'Todos los derechos reservados|All rights reserved|Todos os direitos reservados',
  // ---- descripciones largas frecuentes ----
  'Navega por el resto de secciones de la web.|Browse the rest of the site\'s sections.|Navegue pelas outras seções do site.','Los equipos de cada división de un vistazo.|The teams of each division at a glance.|Os times de cada divisão num relance.',
  'El siguiente encuentro programado, con fecha y hora.|The next scheduled match, with date and time.|A próxima partida programada, com data e hora.','Los partidos ya jugados. Pulsa uno para ver el acta completa.|Matches already played. Tap one to see the full match report.|Partidas já jogadas. Toque em uma para ver a súmula completa.',
  'Los torneos de la asociación. Pulsa uno para verlo.|The association\'s tournaments. Tap one to view it.|Os torneios da associação. Toque em um para vê-lo.','Las novedades de la liga. Pulsa una noticia para leerla completa.|League news. Tap a story to read it in full.|As novidades da liga. Toque em uma notícia para lê-la completa.',
  'Lee la actualidad y las novedades más importantes de la liga.|Read the latest and most important league news.|Leia as últimas e mais importantes novidades da liga.','Los títulos y reconocimientos de la asociación, con sus ganadores.|The association\'s titles and awards, with their winners.|Os títulos e reconhecimentos da associação, com seus vencedores.',
  'Busca, filtra y revisa a cada jugador de la asociación.|Search, filter and review every player in the association.|Busque, filtre e revise cada jogador da associação.','Consulta cada equipo y su clasificación dentro de la comunidad.|Check each team and its standing within the community.|Consulte cada time e sua classificação na comunidade.',
  'Consulta los datos destacados de jugadores y equipos en cada división.|Check the standout stats of players and teams in each division.|Consulte os dados de destaque de jogadores e times em cada divisão.','Cada tarjeta es un partido con fecha, hora y resultado.|Each card is a match with its date, time and result.|Cada cartão é uma partida com data, hora e resultado.',
  'Cada tarjeta es una división con sus equipos.|Each card is a division with its teams.|Cada cartão é uma divisão com seus times.','Cambia entre 1D, 2D, 3D y 4D para ver la tabla de cada una.|Switch between 1D, 2D, 3D and 4D to see each table.|Alterne entre 1D, 2D, 3D e 4D para ver a tabela de cada uma.',
  'Escribe un comentario...|Write a comment...|Escreva um comentário...','Escribe una respuesta...|Write a reply...|Escreva uma resposta...','Filtra la lista por nombre.|Filter the list by name.|Filtre a lista por nome.','Salta a una jornada concreta o ve todas.|Jump to a specific matchday or view them all.|Vá para uma rodada específica ou veja todas.',
  'Cuántos jugadores coinciden con los filtros que tengas aplicados.|How many players match the filters you have applied.|Quantos jogadores correspondem aos filtros aplicados.','Escribe el nombre de un jugador para encontrarlo.|Type a player\'s name to find them.|Digite o nome de um jogador para encontrá-lo.',
  'Hacen falta al menos 2 jugadores para comparar.|At least 2 players are needed to compare.|São necessários pelo menos 2 jogadores para comparar.','Ese jugador no está registrado en las plantillas o actas.|That player is not registered in any squad or match report.|Esse jogador não está registrado em nenhum elenco ou súmula.',
  'Abrir el álbum en una pestaña nueva|Open the album in a new tab|Abrir o álbum em uma nova aba','Álbum oficial HFA|Official HFA album|Álbum oficial HFA','Álbum de cromos|Sticker album|Álbum de figurinhas',
  'Reunión|Meeting|Reunião','Reto de la jornada|Matchday challenge|Desafio da rodada','¡Hoy es el día! 🏆|Today is the day! 🏆|Hoje é o dia! 🏆','Información importante sobre los torneos.|Important information about the tournaments.|Informações importantes sobre os torneios.',
  'Selecciona al menos una posición de juego.|Select at least one playing position.|Selecione pelo menos uma posição de jogo.','Quédate solo con porteros, medios, bandas, delanteros o neutros.|Keep only goalkeepers, midfielders, wingers, forwards or neutrals.|Fique só com goleiros, meio-campistas, alas, atacantes ou neutros.',
  'Elige la división y la categoría: goleadores, asistencias, MVP y más.|Choose the division and category: scorers, assists, MVP and more.|Escolha a divisão e a categoria: artilheiros, assistências, MVP e mais.',
  'Selecciona un equipo local y uno visitante diferentes.|Select two different teams, one home and one away.|Selecione dois times diferentes, um mandante e um visitante.','Elige dos equipos distintos de esa división.|Choose two different teams from that division.|Escolha dois times diferentes dessa divisão.',
  'Selecciona primero una división|Select a division first|Selecione primeiro uma divisão','Selecciona una división|Select a division|Selecione uma divisão','Buscar por división|Search by division|Buscar por divisão','Buscar división|Search division|Buscar divisão',
  'Suelta aquí el equipo local|Drop the home team here|Solte aqui o time mandante','Suelta aquí el equipo visitante|Drop the away team here|Solte aqui o time visitante','Hora (ej. 17:00)|Time (e.g. 17:00)|Hora (ex.: 17:00)','Fecha (ej. 09/05 17:00)|Date (e.g. 09/05 17:00)|Data (ex.: 09/05 17:00)',
  'Las jornadas de esta división ya están generadas.|The matchdays for this division have already been generated.|As rodadas desta divisão já foram geradas.','Selecciona un partido antes de guardar el acta.|Select a match before saving the match report.|Selecione uma partida antes de salvar a súmula.',
  'Ya existe un equipo con ese nombre.|A team with that name already exists.|Já existe um time com esse nome.','Escribe el nombre del torneo.|Enter the tournament name.|Digite o nome do torneio.','Selecciona un torneo creado.|Select a created tournament.|Selecione um torneio criado.',
  'Oferta enviada correctamente a|Offer successfully sent to|Oferta enviada com sucesso para','Nueva contraseña temporal para|New temporary password for|Nova senha temporária para','Contraseña restablecida. Pásale la temporal a|Password reset. Give the temporary one to|Senha redefinida. Passe a temporária para',
  'Aún no hay noticias|No news yet|Ainda não há notícias','Sin nombre|Unnamed|Sem nome','Sin asignar|Unassigned|Não atribuído','Sin registrar|Unregistered|Não registrado','Posición sin registrar|Position not registered|Posição não registrada','Aviso|Notice|Aviso',
  'Equipo:|Team:|Time:','Jugador:|Player:|Jogador:','Registro:|Registered:|Registro:','Igualados:|Tied:|Empatados:','Dueño:|Owner:|Dono:','Descripción (opcional)|Description (optional)|Descrição (opcional)','URL de imagen|Image URL|URL da imagem','URL de imagen (opcional)|Image URL (optional)|URL da imagem (opcional)',
  'Comentario oculto|Hidden comment|Comentário oculto','Escribe un texto para el jugador...|Write a message for the player...|Escreva uma mensagem para o jogador...','Guardar mensaje|Save message|Salvar mensagem','Título o versión (ej. Versión 3)|Title or version (e.g. Version 3)|Título ou versão (ex.: Versão 3)',
  'Jugador (premios individuales)|Player (individual awards)|Jogador (prêmios individuais)','Jugadores (separados por comas)|Players (comma-separated)|Jogadores (separados por vírgulas)','Agregar jugador a un equipo|Add a player to a team|Adicionar jogador a um time','Buscar y agregar jugadores|Search and add players|Buscar e adicionar jogadores',
  'Seleccionar torneo para la gestión de partidos|Select tournament for match management|Selecionar torneio para a gestão de partidas','Elige sobre qué torneo vas a crear y gestionar partidos.|Choose which tournament you will create and manage matches for.|Escolha em qual torneio você vai criar e gerenciar partidas.',
  'Crear jornadas y partidos|Create matchdays and matches|Criar rodadas e partidas','Crea torneos, elige el activo y elimina los que ya no uses.|Create tournaments, choose the active one and delete those you no longer use.|Crie torneios, escolha o ativo e exclua os que não usa mais.',
  'Crea un equipo con su nombre, escudo y división.|Create a team with its name, crest and division.|Crie um time com nome, escudo e divisão.','Gestiona los patrocinadores que se muestran en la web.|Manage the sponsors shown on the site.|Gerencie os patrocinadores exibidos no site.',
  'Añade o borra los reconocimientos de la comunidad.|Add or remove community awards.|Adicione ou apague os reconhecimentos da comunidade.','Las noticias publicadas aparecerán también en el inicio.|Published news will also appear on the home page.|As notícias publicadas também aparecerão no início.',
  '▦ Jornadas y partidos|▦ Matchdays and matches|▦ Rodadas e partidas','⚽ Gestión de partidos|⚽ Match management|⚽ Gestão de partidas','👥 Presentes por partido|👥 Attendance per match|👥 Presenças por partida','▣ Temporadas y torneos|▣ Seasons and tournaments|▣ Temporadas e torneios',
  '♟ Equipos y jugadores|♟ Teams and players|♟ Times e jogadores','♙ Usuarios y divisiones|♙ Users and divisions|♙ Usuários e divisões','♙ Roles|♙ Roles|♙ Funções','★ Palmarés y noticias|★ Honours and news|★ Palmarés e notícias','⚑ Patrocinadores|⚑ Sponsors|⚑ Patrocinadores','▤ Editar y finalizar actas|▤ Edit and finalise match reports|▤ Editar e finalizar súmulas',
  'finalizada ✓|finished ✓|finalizada ✓','en curso|in progress|em andamento','Sin jornadas todavía|No matchdays yet|Ainda sem rodadas','Administrador|Administrator|Administrador','Asociación|Association|Associação','Días|Days|Dias','Día|Day|Dia',
  'Todavía no hay confirmaciones.|No confirmations yet.|Ainda não há confirmações.','Minuto del gol|Goal minute|Minuto do gol','Nombre del sponsor|Sponsor name|Nome do patrocinador','Nombre del torneo|Tournament name|Nome do torneio','Observaciones del acta|Match report notes|Observações da súmula',
  'País no registrado|Country not registered|País não registrado','Ya está en|Already in|Já está em','Estado · Todos|Status · All|Status · Todos','IP: sin registrar|IP: not registered|IP: não registrado','Todavía no hay equipos en esta división.|There are no teams in this division yet.|Ainda não há times nesta divisão.',
  'Buscar escudo en TheSportsDB|Search crest on TheSportsDB|Buscar escudo no TheSportsDB','Descripción (opcional)|Description (optional)|Descrição (opcional)','Descripción de la noticia|News description|Descrição da notícia',
  '📊 Predicción|📊 Prediction|📊 Previsão','👥 Presentes (0) · conexión|👥 Attendees (0) · connection|👥 Presentes (0) · conexão','🎬 Enlace de YouTube del resumen del partido|🎬 Match summary YouTube link|🎬 Link do YouTube do resumo da partida',
  'El torneo activo sincroniza los partidos, la clasificación y las estadísticas.|The active tournament syncs the matches, standings and statistics.|O torneio ativo sincroniza as partidas, a classificação e as estatísticas.',
  'Estamos mejorando HFA para ti. Volveremos muy pronto, gracias por tu paciencia.|We are improving HFA for you. We will be back very soon, thank you for your patience.|Estamos melhorando o HFA para você. Voltaremos muito em breve, obrigado pela paciência.',
  'Edita actas, finaliza resultados y consulta los encuentros por división.|Edit match reports, finalise results and browse matches by division.|Edite súmulas, finalize resultados e consulte as partidas por divisão.',
  'Busca por división y selecciona el equipo que quieres eliminar.|Search by division and select the team you want to delete.|Busque por divisão e selecione o time que deseja excluir.',
  'El torneo seleccionado quedará activo para crear y administrar partidos.|The selected tournament will become active for creating and managing matches.|O torneio selecionado ficará ativo para criar e gerenciar partidas.',
  'El dueño asignado verá la sección Jugadores.|The assigned owner will see the Players section.|O dono atribuído verá a seção Jogadores.',
  'ADMIN gestiona todo; Moderador consulta IP y registra resultados; Árbitro solo registra resultados.|ADMIN manages everything; Moderator checks IPs and records results; Referee only records results.|ADMIN gerencia tudo; Moderador consulta IP e registra resultados; Árbitro apenas registra resultados.',
  'Agrega campeones de cada versión, Balones de Oro y mejores MED o BANDAS.|Add champions of each edition, Ballon d\'Or winners and best MIDs or WINGs.|Adicione campeões de cada edição, Bolas de Ouro e melhores MEI ou ALAS.',
  'Aquí salen todas las cuentas registradas con su IP y su división. Pulsa un nombre para asignarle división.|All registered accounts appear here with their IP and division. Tap a name to assign a division.|Aqui aparecem todas as contas registradas com seu IP e divisão. Toque em um nome para atribuir uma divisão.',
  'Se eliminarán también sus partidos y ofertas pendientes; las cuentas de sus jugadores no se borrarán.|Its matches and pending offers will also be deleted; its players\' accounts will not be deleted.|As partidas e ofertas pendentes também serão excluídas; as contas dos jogadores não serão apagadas.',
  'Crea torneos, elige cuál queda activo y elimina los que ya no se usarán. Al eliminar un torneo también se eliminarán sus partidos asociados.|Create tournaments, choose which one is active and delete those that will no longer be used. Deleting a tournament also deletes its matches.|Crie torneios, escolha qual fica ativo e exclua os que não serão mais usados. Ao excluir um torneio, suas partidas também serão excluídas.',
  'Quién ha dado presente en cada partido y si lo hizo con ExitLag o VPN (declarado por el jugador o detectado automáticamente).|Who has marked attendance in each match and whether they used ExitLag or a VPN (declared by the player or detected automatically).|Quem marcou presença em cada partida e se usou ExitLag ou VPN (declarado pelo jogador ou detectado automaticamente).',
  'Busca una cuenta registrada. Al seleccionarla verás sus divisiones y podrás elegir un equipo permitido.|Search for a registered account. Once selected you will see its divisions and can choose an allowed team.|Busque uma conta registrada. Ao selecioná-la você verá suas divisões e poderá escolher um time permitido.',
  
  
  '© 2026 HFA. Comunidad de rol futbolístico independiente para Habbo.es. No está afiliada, patrocinada ni respaldada por Sulake Corporation ni por Habbo.|© 2026 HFA. Independent football role-play community for Habbo.es. Not affiliated with, sponsored by or endorsed by Sulake Corporation or Habbo.|© 2026 HFA. Comunidade independente de roleplay de futebol para o Habbo.es. Não é afiliada, patrocinada nem endossada pela Sulake Corporation nem pelo Habbo.',
  'Plantillas|Squads|Elencos','Plantilla|Squad|Elenco','Programado|Scheduled|Agendada','En juego|In play|Em jogo','En directo|Live|Ao vivo','Pendiente|Pending|Pendente','Aceptada|Accepted|Aceita','Rechazada|Declined|Recusada','Titular|Starter|Titular','Suplente|Substitute|Reserva','Entrenador|Coach|Técnico','Capitán|Captain|Capitão',
  'Ver presentes|View attendees|Ver presentes','HFA · Sección|HFA · Section|HFA · Seção','Noticias|News|Notícias','Notificaciones|Notifications|Notificações','Mensajes|Messages|Mensagens'
  ];

  // Ajustes de Portugal sobre el portugués de Brasil (palabra completa, conserva mayúsculas).
  var PT_PT = [['Times','Equipas'],['time','equipa'],['times','equipas'],['Time','Equipa'],['TIME','EQUIPA'],['TIMES','EQUIPAS'],['Partidas','Jogos'],['partidas','jogos'],['Partida','Jogo'],['partida','jogo'],['PARTIDAS','JOGOS'],['PARTIDA','JOGO'],
    ['Gols','Golos'],['gols','golos'],['Gol','Golo'],['gol','golo'],['GOLS','GOLOS'],['Senha','Palavra-passe'],['senha','palavra-passe'],['SENHA','PALAVRA-PASSE'],['senhas','palavras-passe'],['Senhas','Palavras-passe'],
    ['Usuário','Utilizador'],['usuário','utilizador'],['Usuários','Utilizadores'],['usuários','utilizadores'],['arquivo','ficheiro'],['Arquivo','Ficheiro'],['Salvar','Guardar'],['salvar','guardar'],['SALVAR','GUARDAR'],['Salvas','Guardadas'],['salvas','guardadas'],['salva','guardada'],['salvo','guardado'],
    ['Excluir','Eliminar'],['excluir','eliminar'],['Apagar','Eliminar'],['apagar','eliminar'],['APAGAR','ELIMINAR'],['Registrar','Registar'],['registrar','registar'],['Registrado','Registado'],['registrado','registado'],['Registrada','Registada'],['registrada','registada'],['Registrados','Registados'],['registrados','registados'],
    ['REGISTRADOS','REGISTADOS'],['Registro','Registo'],['registro','registo'],['Baixar','Descarregar'],['Entrar','Iniciar sessão'],['Entre','Inicie sessão'],['entre','inicie sessão'],['Mandante','Anfitrião'],['Tela','Ecrã'],['Equipe','Equipa'],
    ['Conectar','Ligar'],['conectar','ligar'],['conexão','ligação'],['Conexão','Ligação'],['Fechar','Fechar'],['Celular','Telemóvel'],['Digite','Escreva'],['Toque','Toque'],['Clique','Clique'],['Pular','Saltar'],['Gerencie','Gira'],['gerenciar','gerir'],['Gerenciar','Gerir'],['Gestão','Gestão'],
    ['Carregando','A carregar'],['Atualizando','A atualizar'],['Verificando','A verificar'],['Salvando','A guardar'],['Restaurando','A restaurar'],['Preparando','A preparar'],['Cartão','Cartão'],['Escalação','Alinhamento'],['escalação','alinhamento'],['Súmulas','Fichas de jogo'],['súmulas','fichas de jogo'],['Súmula','Ficha de jogo'],['súmula','ficha de jogo'],['SÚMULAS','FICHAS DE JOGO'],['SÚMULA','FICHA DE JOGO'],
    ['Rodada','Jornada'],['rodada','jornada'],['Rodadas','Jornadas'],['rodadas','jornadas'],['RODADA','JORNADA'],['RODADAS','JORNADAS'],['Goleiro','Guarda-redes'],['goleiro','guarda-redes'],['goleiros','guarda-redes'],['GOL','GR'],['Ala','Ala'],['Gramado','Relvado'],['figurinhas','cromos'],['Figurinhas','Cromos'],
    ['Alterar','Alterar'],['Aparência','Aparência'],['Manutenção','Manutenção'],['Você','Tu'],['você','tu']];

  var LS = 'hfa:lang';
  function getLang() { try { var v = localStorage.getItem(LS); if (v && LANGS[v]) return v; } catch (e) {} return 'es'; }
  function setLangStore(v) { try { localStorage.setItem(LS, v); } catch (e) {} }

  // ---- diccionarios por idioma ----
  var maps = { en: {}, 'pt-BR': {}, 'pt-PT': {} }, keys = [];
  function swapPT(text) {
    PT_PT.forEach(function (p) {
      if (p[0] === p[1]) return;
      text = text.replace(new RegExp('(?<![\\p{L}\\-])' + p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}\\-])', 'gu'), p[1]);
    });
    return text;
  }
  DICT.forEach(function (line) {
    var a = line.split('|'); if (a.length < 3) return;
    var es = a[0].trim(), en = a[1].trim(), pt = a[2].trim(), k = es.toLowerCase();
    if (maps.en[k]) return;
    maps.en[k] = en; maps['pt-BR'][k] = pt; maps['pt-PT'][k] = swapPT(pt);
    keys.push(es);
  });
  keys.sort(function (x, y) { return y.length - x.length; });
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var reAll = null;
  function adaptCase(src, out) {
    var letters = src.replace(/[^\p{L}]/gu, '');
    if (letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) return out.toUpperCase();
    return out;
  }

  var PATTERNS = [
    [/^Rol actual: (.+)$/, 'Current role: $1', 'Função atual: $1'],
    [/^Sesión: (.+)$/, 'Session: $1', 'Sessão: $1'],
    [/^Torneo: (.+)$/, 'Tournament: $1', 'Torneio: $1'],
    [/^Equipos de la (\dD) · arrastra a una zona$/, 'Teams of $1 · drag to a zone', 'Times da $1 · arraste para uma zona'],
    [/^Presentes \((\d+)\) · conexión$/, 'Attendees ($1) · connection', 'Presentes ($1) · conexão'],
    [/^(\d+)\/(\d+) jugados$/, '$1/$2 played', '$1/$2 jogadas'],
    [/^Han confirmado asistencia \((\d+)\)$/i, 'Attendance confirmed ($1)', 'Presença confirmada ($1)'],
    [/^Jornada (\d+)$/, 'Matchday $1', 'Rodada $1'],
    [/^J(\d+)$/, 'MD$1', 'R$1'],
    [/^J(\d+) · Jornada (\d+)$/, 'MD$1 · Matchday $2', 'R$1 · Rodada $2'],
    [/^Divisiones asignadas: (.+)$/, 'Assigned divisions: $1', 'Divisões atribuídas: $1'],
    [/^Hola, (.+)$/, 'Hello, $1', 'Olá, $1'],
    [/^Bienvenido, (.+)$/i, 'Welcome, $1', 'Bem-vindo, $1'],
    [/^(\d+) equipos? · (\d+) partidos?$/, '$1 teams · $2 matches', '$1 times · $2 partidas'],
    [/^Se guardó una copia automática antes de empezar\.$/, 'An automatic backup was saved before starting.', 'Uma cópia automática foi salva antes de começar.']
  ];
  function trPat(seg, lang) {
    for (var i = 0; i < PATTERNS.length; i++) {
      var p = PATTERNS[i], m = seg.match(p[0]);
      if (m) { var tpl = lang === 'en' ? p[1] : p[2], out = tpl.replace(/\$(\d)/g, function (_, n) { return tr(m[+n], lang); }); return lang === 'pt-PT' ? swapPT(out) : out; }
    }
    return null;
  }
  function tr(text, lang) {
    if (lang === 'es' || !text) return text;
    var m = maps[lang]; if (!m) return text;
    var lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0], core = text.slice(lead.length, text.length - trail.length);
    if (!core) return text;
    var norm = core.replace(/\s+/g, ' '), low = norm.toLowerCase();
    if (m[low]) return lead + adaptCase(norm, m[low]) + trail;
    var pm = trPat(norm, lang); if (pm !== null) return lead + pm + trail;
    if (norm.indexOf(' · ') > 0) {
      var segs = norm.split(' · '), changed = false;
      segs = segs.map(function (g) { var l = g.toLowerCase(), r = maps[lang][l]; if (r === undefined) r = trPat(g, lang); if (r === null || r === undefined) return g; changed = true; return r; });
      if (changed) return lead + segs.join(' · ') + trail;
    }
    if (reAll) {
      var out = norm.replace(reAll, function (hit) { var t = m[hit.toLowerCase()]; return t ? adaptCase(hit, t) : hit; });
      if (out !== norm) return lead + out + trail;
    }
    return text;
  }
  window.hfaTranslate = function (t) { return tr(t, getLang()); };

  // ---- aplicación sobre el DOM ----
  var origText = new WeakMap(), origAttr = new WeakMap(), observer = null, busy = false;
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  function skipEl(el) { return !el || SKIP[el.nodeName] || (el.closest && el.closest('[data-no-i18n],[contenteditable="true"],.brand-name')); }
  function doText(node, lang) {
    var p = node.parentNode; if (skipEl(p)) return;
    var cur = node.nodeValue;
    var rec = origText.get(node);
    if (rec && cur !== rec.out) rec = null;                      // el contenido cambió desde fuera
    var base = rec ? rec.src : cur;
    var out = lang === 'es' ? base : tr(base, lang);
    if (out !== cur) { node.nodeValue = out; }
    origText.set(node, { src: base, out: out });
  }
  function doAttr(el, lang) {
    if (el.closest && el.closest('[data-no-i18n],[contenteditable="true"]')) return;
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      if (a === 'alt' && /avatar|habbo-imaging/.test(el.getAttribute('src') || '')) return;
      var store = origAttr.get(el) || {}; var cur = el.getAttribute(a), rec = store[a];
      if (rec && cur !== rec.out) rec = null;
      var base = rec ? rec.src : cur, out = lang === 'es' ? base : tr(base, lang);
      if (out !== cur) el.setAttribute(a, out);
      store[a] = { src: base, out: out }; origAttr.set(el, store);
    });
  }
  function walk(root, lang) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root, lang); return; }
    if (root.nodeType !== 1) return;
    if (SKIP[root.nodeName]) { if (root.nodeName === 'TEXTAREA') doAttr(root, lang); return; }
    doAttr(root, lang);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n, lang); else if (!SKIP[n.nodeName] || n.nodeName === 'TEXTAREA') doAttr(n, lang); }
  }
  var pending = null;
  function applyAll() {
    var lang = getLang();
    busy = true;
    try {
      document.documentElement.setAttribute('lang', lang === 'pt-BR' ? 'pt-BR' : lang === 'pt-PT' ? 'pt-PT' : lang);
      walk(document.body, lang);
      var tEl = document.querySelector('title');
      if (tEl) { var rec = origText.get(tEl); if (!rec || tEl.textContent !== rec.out) rec = { src: tEl.textContent, out: tEl.textContent }; var o = lang === 'es' ? rec.src : tr(rec.src, lang); if (o !== tEl.textContent) tEl.textContent = o; origText.set(tEl, { src: rec.src, out: o }); }
    } finally { busy = false; }
  }
  function schedule(muts) {
    if (busy) return;
    var lang = getLang();
    busy = true;
    try {
      muts.forEach(function (m) {
        if (m.type === 'childList') m.addedNodes.forEach(function (n) { walk(n, lang); });
        else if (m.type === 'characterData') doText(m.target, lang);
        else if (m.type === 'attributes') doAttr(m.target, lang);
      });
    } finally { busy = false; }
  }
  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (muts) { if (!busy) schedule(muts); });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }


  // alert / confirm / prompt también se traducen
  ['alert', 'confirm', 'prompt'].forEach(function (fn) {
    var orig = window[fn]; if (!orig || orig.__hfa) return;
    var w = function (msg, def) { var m = typeof msg === 'string' ? msg.split('\n').map(function (l) { return tr(l, getLang()); }).join('\n') : msg; return fn === 'prompt' ? orig.call(window, m, def) : orig.call(window, m); };
    w.__hfa = true; window[fn] = w;
  });

  // ---- selector ----
  function buildPicker() {
    if (document.getElementById('hfaLangBtn')) return;
    var st = document.createElement('style');
    st.textContent = '.hfa-lang{position:fixed;left:212px;bottom:16px;z-index:9991}.hfa-lang>button{border:1px solid var(--border,#22302a);background:var(--panel,#121a17);color:var(--text-hi,#f2f6f4);border-radius:8px;padding:10px 13px;font:600 13px Inter,Arial,sans-serif;cursor:pointer}' +
      '.hfa-lang-menu{position:absolute;left:0;bottom:calc(100% + 8px);min-width:200px;padding:6px;border:1px solid var(--border,#22302a);border-radius:10px;background:var(--panel,#121a17);box-shadow:0 18px 40px rgba(0,0,0,.45);display:none;flex-direction:column;gap:2px}.hfa-lang.open .hfa-lang-menu{display:flex}' +
      '.hfa-lang-menu button{border:0;background:transparent;color:var(--text-mid,#b7c4be);text-align:left;padding:10px 12px;border-radius:7px;font:500 14px Inter,Arial,sans-serif;cursor:pointer}.hfa-lang-menu button:hover{background:rgba(52,232,143,.1);color:var(--text-hi,#f2f6f4)}.hfa-lang-menu button[aria-checked="true"]{color:var(--green,#34e88f);font-weight:700}' +
      '@media(max-width:640px){.hfa-lang{left:12px;bottom:calc(12px + env(safe-area-inset-bottom))}.hfa-lang>button{padding:9px 11px;font-size:12px;border-radius:999px}}';
    document.head.appendChild(st);
    var wrap = document.createElement('div'); wrap.className = 'hfa-lang'; wrap.setAttribute('data-no-i18n', '');
    wrap.innerHTML = '<button type="button" id="hfaLangBtn" aria-haspopup="true" aria-label="Language / Idioma">🌐 <span id="hfaLangShort"></span></button><div class="hfa-lang-menu" role="menu">' +
      Object.keys(LANGS).map(function (k) { return '<button type="button" role="menuitemradio" data-lang="' + k + '">' + LANGS[k] + '</button>'; }).join('') + '</div>';
    document.body.appendChild(wrap);
    function refresh() {
      var cur = getLang(); document.getElementById('hfaLangShort').textContent = SHORT[cur];
      wrap.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.lang === cur)); });
    }
    wrap.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-lang]');
      if (opt) { setLangStore(opt.dataset.lang); wrap.classList.remove('open'); refresh(); applyAll(); try { window.dispatchEvent(new CustomEvent('hfa:lang', { detail: opt.dataset.lang })); } catch (x) {} return; }
      if (e.target.closest('#hfaLangBtn')) wrap.classList.toggle('open');
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.hfa-lang')) wrap.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') wrap.classList.remove('open'); });
    refresh();
  }

  function boot() { buildPicker(); startObserver(); applyAll(); setTimeout(applyAll, 600); setTimeout(applyAll, 2000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
