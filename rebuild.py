import codecs

fpath = r'c:\Users\User\Desktop\Projet PFE\components\modules\EtatSyntheseModule.tsx'
with codecs.open(fpath, 'r', 'utf-8') as f:
    content = f.read()

cpc_start_marker = "            {/* \u2500\u2500\u2500 CPC"
footer_marker = "\n        </div>\n    );\n}"

cpc_start = content.find(cpc_start_marker)
footer_start = content.find(footer_marker, cpc_start)

if cpc_start == -1 or footer_start == -1:
    print(f"ERROR: cpc={cpc_start}, footer={footer_start}")
    exit(1)

# CPC rewritten to EXACTLY match Bilan visual pattern:
# - Same card: bg-neo-white border-3 border-neo-black shadow-neo
# - Colored section header like Bilan: bg-neo-blue/5 + text-neo-blue + border-b border-neo-blue/20
# - Same data rows: border-b border-gray-100 hover:bg-gray-50
# - Same sous-total rows: bg-gray-50 border-b-2 border-gray-200
# - Same tfoot: bg-neo-black text-white
# - 3 columns layout: Libellé | Charges | Produits (no more "Compte" column to simplify)

new_cpc = r"""            {/* ─── CPC ───────────────────────────────────── */}
            {activeTab === 'cpc' && (
                <div className="bg-neo-white border-3 border-neo-black shadow-neo overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b-3 border-neo-black bg-neo-blue/10 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                            Compte de Produits et Charges
                        </h3>
                    </div>
                    <table className="w-full text-sm flex-1">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-neo-black font-display text-xs uppercase tracking-wider text-gray-500">
                                <th className="text-left px-4 py-3 w-24">Compte</th>
                                <th className="text-left px-4 py-3">Libellé</th>
                                <th className="text-right px-4 py-3 w-36">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* ── I. Exploitation ── */}
                            <tr className="bg-neo-blue/5">
                                <td colSpan={3} className="px-4 py-2 font-display font-bold text-xs uppercase tracking-wider text-neo-blue border-b border-neo-blue/20">
                                    I. Exploitation
                                </td>
                            </tr>
                            {cpcData.exploitation.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            {cpcData.exploitation.produits.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-right text-xs font-display font-bold text-gray-600">Résultat Exploitation</td>
                                <td className={`px-4 py-2 text-right font-mono font-bold ${cpcData.exploitation.resultat < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.exploitation.resultat)}
                                </td>
                            </tr>

                            {/* ── II. Financier ── */}
                            <tr className="bg-neo-blue/5">
                                <td colSpan={3} className="px-4 py-2 font-display font-bold text-xs uppercase tracking-wider text-neo-blue border-b border-neo-blue/20">
                                    II. Financier
                                </td>
                            </tr>
                            {cpcData.financier.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            {cpcData.financier.produits.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-right text-xs font-display font-bold text-gray-600">Résultat Financier</td>
                                <td className={`px-4 py-2 text-right font-mono font-bold ${cpcData.financier.resultat < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.financier.resultat)}
                                </td>
                            </tr>

                            {/* ── III. Résultat Courant ── */}
                            <tr className="bg-neo-yellow/20 border-t-2 border-b-2 border-neo-black">
                                <td colSpan={2} className="px-4 py-3 font-display font-bold text-sm uppercase tracking-wider">
                                    III. Résultat Courant
                                </td>
                                <td className={`px-4 py-3 text-right font-mono font-bold text-base ${cpcData.courant < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.courant)}
                                </td>
                            </tr>

                            {/* ── IV. Non Courant ── */}
                            <tr className="bg-neo-blue/5">
                                <td colSpan={3} className="px-4 py-2 font-display font-bold text-xs uppercase tracking-wider text-neo-blue border-b border-neo-blue/20">
                                    IV. Non Courant
                                </td>
                            </tr>
                            {cpcData.nonCourant.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            {cpcData.nonCourant.produits.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-right text-xs font-display font-bold text-gray-600">Résultat Non Courant</td>
                                <td className={`px-4 py-2 text-right font-mono font-bold ${cpcData.nonCourant.resultat < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.nonCourant.resultat)}
                                </td>
                            </tr>

                            {/* ── V. Impôts ── */}
                            <tr className="bg-neo-blue/5">
                                <td colSpan={3} className="px-4 py-2 font-display font-bold text-xs uppercase tracking-wider text-neo-blue border-b border-neo-blue/20">
                                    V. Impôts sur les Résultats
                                </td>
                            </tr>
                            {cpcData.impot.charges.length === 0 ? (
                                <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                            ) : cpcData.impot.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-right text-xs font-display font-bold text-gray-600">Sous-total</td>
                                <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(cpcData.impot.totalCharges)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-neo-black text-white">
                                <td colSpan={2} className="px-4 py-4 font-display font-bold text-sm uppercase tracking-wider">RÉSULTAT NET</td>
                                <td className="px-4 py-4 text-right font-mono font-bold text-lg">{fmt(cpcData.net)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}"""

new_content = content[:cpc_start] + new_cpc + content[footer_start:]

with codecs.open(fpath, 'w', 'utf-8') as f:
    f.write(new_content)

print("SUCCESS: CPC rewritten to match Bilan design exactly")
