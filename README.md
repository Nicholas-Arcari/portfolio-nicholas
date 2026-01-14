comandi da terminale per fare la push e il deploy:

cd portfolio-nicholas

git add .

git commit -m "testo qui..."

git push

npm run build

cd dist

git init

git add .

git commit -m "Nuovo Deploy"

git push -f https://github.com/Nicholas-Arcari/portfolio-nicholas.git main:gh-pages
