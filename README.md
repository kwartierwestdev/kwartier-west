# Kwartier West (v1)

Split landing: Tekno / Hip hop
Routes (static):
- /index.html
- /pages/tekno/index.html
- /pages/hiphop/index.html

Brand: zwart / rood / wit


find ALLE_WEBSITES/clients/kwartier-west -maxdepth 3 -type d


cat > ALLE_WEBSITES/clients/kwartier-west/index.html <<'EOF'
<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <title>Kwartier West</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <meta name="description" content="Kwartier West — collectief & organisatie voor hip hop en tekno." />

  <link rel="stylesheet" href="./css/base.css" />
</head>
<body class="split">

  <a class="half tekno" href="./pages/tekno/index.html">
    <div class="inner">
      <h1>Tekno</h1>
      <p>Soundsystem culture • underground • nacht</p>
    </div>
  </a>

  <a class="half hiphop" href="./pages/hiphop/index.html">
    <div class="inner">
      <h1>Hip hop</h1>
      <p>Bars • identiteit • verhaal</p>
    </div>
  </a>

</body>
</html>
