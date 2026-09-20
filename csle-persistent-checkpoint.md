# Checkpoint persistente — Plataforma CSLE

**Versão:** CSLE Platform Vision v0.2  
**Data do checkpoint:** 2026-09-20  
**Estado:** fundação arbórea implementada e compilável; interface visual, persistência Supabase e testes de comportamento ainda são as próximas fases.

---

## Visão do produto

O projeto será uma plataforma de aprendizagem personalizada baseada no método CSLE, com múltiplas aplicações de estudo. O app de inglês é o primeiro laboratório. Futuramente, o mesmo núcleo poderá alimentar produtos para concursos públicos, ENEM, vestibulares, certificações e outras provas.

O núcleo pedagógico será compartilhado entre aplicações:
- linha central;
- círculo de reforço;
- espiral de aprofundamento;
- linhas retas de progressão;
- linhas paralelas de transferência;
- pensamento arbóreo;
- porquê central;
- retorno semântico;
- memória individual;
- recomendações adaptativas;
- revisão espaçada;
- gamificação saudável;
- consentimento e controle do usuário.

---

## Método de aprendizagem do usuário

O usuário começa com uma raiz ou tema central, como `Friends`. Quando uma associação gera interesse, ele abre uma espiral de exploração. Essa espiral pode se afastar bastante da linha inicial, passando por linguagem, cultura, lógica, exemplos, comparações e outros contextos.

Quando o interesse diminui ou surge a pergunta sobre por que aquele caminho foi iniciado, o sistema deve reconstruir a conexão, formular o porquê central e retornar ao ponto exato da linha central. A digressão não é tratada automaticamente como distração; ela pode ser uma etapa produtiva de compreensão.

O objetivo é que o aluno veja exemplos, entenda a lógica, compare situações, use o conhecimento, explique com as próprias palavras e transfira o conceito para outro contexto.

---

## Linguagem segura

O produto não deve afirmar que mede dopamina, hiperfoco clínico, TDAH ou qualquer estado biológico ou diagnóstico. O termo operacional aprovado é `energia de exploração`, acompanhado de sinais observáveis, relatos do usuário e resultados de aprendizagem.

A gamificação deve sustentar aprendizagem e autonomia, não dependência. Não usar culpa, medo de perder streak, recompensas variáveis compulsivas, notificações insistentes ou tempo de tela como métrica principal.

---

## Evolução contínua da IA

A IA terá três níveis de evolução:

1. **Aprendizado imediato:** adapta a sessão atual ao comportamento e às escolhas do usuário.
2. **Memória pessoal:** mantém um modelo privado, editável, exportável e apagável do aluno.
3. **Evolução global:** usa somente dados autorizados, desidentificados e curados para treinar versões futuras do tutor.

O aprendizado individual pode ser contínuo. Alterações globais precisam de datasets versionados, avaliação, testes de regressão, análise de viés, auditoria e rollback.

---

## Consentimento

Consentimentos são separados para:
- personalização;
- análise privada;
- pesquisa agregada;
- treinamento de modelos;
- voz e transcrição;
- futuros sensores.

Aceitar personalização não implica aceitar treinamento de modelos. Recusar pesquisa não bloqueia o uso normal do aplicativo.

---

## Estado técnico atual

**Projeto principal:** `/home/ubuntu/work/english-app/sonaoaprendeseforjumento-main`

**Tecnologias:** React 19, TypeScript, TanStack Start, Vite, Tailwind, Supabase e servidor Node/WebSocket para voz.

**Arquivos principais da fundação CSLE arbórea:**
- `src/lib/csleTree.ts`
- `src/store/useCSLE.ts`

A implementação atual inclui raiz, galhos, subgalhos, tipos de galho, galho ativo, energia de exploração, porquê central, notas, fechamento, resumo e retorno à linha central. Ela preserva os modos `LINE`, `CIRCLE`, `SPIRAL` e `COMPANION` existentes.

**Validação registrada:** `npm run build` concluído com sucesso após a implementação da árvore.

O lint ainda possui problemas de formatação Prettier existentes. Isso deverá ser corrigido em uma fase própria, sem misturar a correção com mudanças pedagógicas.

---

## Artefatos persistentes

- Especificação de produto: `/home/ubuntu/work/english-app/english-learning-product-spec.md`
- Blueprint para concursos e exames: `/home/ubuntu/work/english-app/csle-exam-product-blueprint.md`
- Governança de dados: `/home/ubuntu/work/english-app/csle-learning-data-governance.md`
- Relatório GitHub: `/home/ubuntu/work/english-app/github-integration-assessment.md`
- Backup da fundação: `/home/ubuntu/work/english-app/backups/csle-arboreal-foundation-v0.1.tar.gz`
- Checksum do backup: `/home/ubuntu/work/english-app/backups/csle-arboreal-foundation-v0.1.tar.gz.sha256`

---

## Próximas fases aprovadas

1. Criar a interface visual da árvore CSLE.
2. Integrar árvore, conversa e lições.
3. Adicionar retorno semântico e resumo de sessão.
4. Criar testes de comportamento para linha, círculo, espiral e retorno.
5. Fortalecer autenticação, rate limiting e validação do servidor de voz.
6. Persistir a árvore resumida no Supabase com RLS.
7. Criar o modelo de eventos de aprendizagem com consentimento em camadas.
8. Unificar o motor como pacote reutilizável antes de iniciar o produto de concursos.

---

## Regra de retomada

Ao retomar o projeto, começar pela interface visual da árvore CSLE. Não iniciar ainda ingestão massiva de provas, treinamento global de IA ou uso de dados biométricos. Primeiro consolidar a experiência no app de inglês, testar com dados controlados e manter o checkpoint anterior como fallback.

---

## Atualização — interface visual CSLE v0.2

A primeira interface visual da árvore foi integrada à rota `/conversar` em `src/components/CSLETreePanel.tsx` e `src/routes/conversar.tsx`.

A interface já permite visualizar a linha central, o caminho ativo, o porquê central, abrir galhos com tipo, conectar ou compreender o galho, adiar, retornar à linha central e acompanhar o resumo da exploração.

**Validação adicional:** `npm run build` concluído com sucesso após a integração visual.

**Próxima retomada:** validar a experiência com interação real, melhorar o layout responsivo, adicionar notas/evidências ao painel e criar testes para as transições da árvore.

---

## Atualização — séries e legendas conectadas ao CSLE v0.3

A rota `/legendas`, também usada por `/series`, foi integrada ao motor CSLE sem alteração do fluxo original de séries, temporadas, episódios, geração de frases, colagem de diálogos ou upload de legendas.

Quando um episódio é processado, ele pode iniciar uma árvore com a série e o episódio como linha central. Ao salvar uma frase para praticar, a frase abre um galho linguístico ou contextual, ativa a espiral e pode registrar a explicação como porquê central. O painel da árvore aparece junto aos resultados do episódio e permite continuar, conectar, compreender, adiar ou retornar à linha central.

**Validação adicional:** `npm run build` concluído com sucesso após a integração de séries e legendas.

**Próxima retomada:** criar iniciativas ativas do tutor para episódios, como missão pré-episódio, perguntas de conexão, resumo pós-episódio e sugestões de retorno, sem substituir o fluxo atual.

---

## Atualização — tutor ativo em séries v0.4

A rota de séries/legendas ganhou uma primeira camada de iniciativa ativa sem alterar o fluxo existente. O tutor agora apresenta uma missão opcional antes do episódio, com objetivo de observação curto e foco em perceber frases que tenham utilidade ou despertem curiosidade.

Após a análise de frases, o tutor propõe o próximo passo. Ao salvar uma frase, ele orienta o usuário a escolher entre conectar a uma situação própria, comparar formas de dizer ou retornar à cena. As mensagens são contextuais, curtas e podem ser ignoradas; não há bloqueio do estudo.

**Validação adicional:** `npm run build` concluído com sucesso após essa etapa.

**Próxima retomada:** criar o resumo pós-episódio com pontos fortes, galhos abertos, frases para revisão e um próximo passo recomendado, preservando o controle do usuário.

---

## Diretriz permanente — segurança em camadas

A segurança é requisito central do CSLE. O sistema deve assumir que ataques automatizados e futuras IAs ofensivas existirão. A meta não é prometer invulnerabilidade, mas tornar o ataque demorado, caro, detectável, limitado e pouco atraente.

A arquitetura seguirá defesa em profundidade: identidade, autorização/RLS, validação de entrada, isolamento de uploads, IA com menor privilégio, rate limiting, proteção do servidor de voz, gestão de segredos, cadeia de fornecimento, backups isolados, observabilidade, detecção, resposta e recuperação.

Nenhuma nova função deve ser considerada completa sem responder quais são suas entradas maliciosas possíveis, privilégios mínimos, limites de custo, sinais de abuso, mecanismo de desligamento e estratégia de restauração.

**Plano detalhado:** `/home/ubuntu/work/english-app/csle-security-defense-in-depth.md`.

---

## Atualização — primeira auditoria e hardening de segurança v0.5

Foi feita uma auditoria inicial de ambiente, RLS, armazenamento, acessos Supabase e servidor de voz. As áreas privadas principais usam políticas por `auth.uid()`. As salas públicas permanecem amplas por desenho do produto e devem continuar separadas de dados privados.

O servidor de voz foi endurecido sem alterar seu fluxo funcional: origem curinga deixou de ser aceita em produção, localhost virou padrão de desenvolvimento, foi adicionado rate limit HTTP, limite explícito de JSON, limite de conexões WebSocket, limite de payload e contagem de conexões ativas.

**Validações concluídas:** `node --check voice-server/src/server.js` e `npm run build` passaram.

**Auditoria detalhada:** `/home/ubuntu/work/english-app/csle-security-audit-2026-09-20.md`.

**Plano geral:** `/home/ubuntu/work/english-app/csle-security-defense-in-depth.md`.

**Próxima camada de segurança:** autenticação de sessão no WebSocket, testes automatizados de RLS/isolamento entre usuários, secret scanning quando o projeto estiver em Git, rate limiting distribuído para múltiplas réplicas e restauração testada de backups.
