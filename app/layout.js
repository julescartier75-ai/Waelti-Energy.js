import '../styles/globals.css';

export const metadata = {
  title: 'Tableau énergie',
  description: 'Production/consommation (Helion ONE) & eCarUp',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
