import base64
import io
import pandas as pd
from dash import Dash, html, dcc, Input, Output, State, callback_context
import dash_table
import dash_bootstrap_components as dbc
from dash_bootstrap_templates import ThemeSwitchAIO
import plotly.express as px
import plotly.graph_objects as go

# -------------------------------
# Inicialização da app
# -------------------------------
app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP], suppress_callback_exceptions=True)
app.title = "Dashboard de Vendas"

tab_card = {"height":"100%"}
main_config = {
    "hovermode":"x unified",
    "legend":{"yanchor":"top",
              "y":0.9,
              "xanchor":"left",
              "x":0.1,
              "title":{"text":None},
              "font":{"color":"white"},
              "bgcolor":"rgba(0,0,0,0.5)"},
    "margin": {"l":10, "r":10, "t":10, "b":10}
}
config_graph = {"displayModeBar": False, "showTips": False}
template_theme1 = "flatly"
template_theme2 = "darkly"
url_theme1 = dbc.themes.FLATLY
url_theme2 = dbc.themes.DARKLY

colunas_obrigatorias = ["Data", "Tipo", "Categoria", "Subcategoria", "Valor", "Forma de Pagamento", "Status"]


# -------------------------------
# Layout
# -------------------------------
app.layout = html.Div([

    dcc.Store(id="store-dados"),
    dcc.Store(id="dados_fluxo_total"),
    dcc.Store(id="store-tela", data="upload"),

    html.H2("Relatórios Financeiros", style={"textAlign": "center"}),

    # -------- TELA UPLOAD --------
    html.Div(id="tela-upload", children=[
        dbc.Container([

            dcc.Upload(
            id="upload-arquivo",
            children=html.Div([
                "Arraste ou clique para enviar o arquivo (CSV ou XLSX)"
            ]),
            style={
                "width": "100%",
                "height": "120px",
                "lineHeight": "120px",
                "borderWidth": "2px",
                "borderStyle": "dashed",
                "borderRadius": "10px",
                "textAlign": "center",
                "marginBottom": "20px",
                "marginTop":"50px"
            }
        ),

        html.Div(id="mensagem-upload", style={"margin-top":"7px"}),
        html.Div(id="preview-tabela", style={"margin-top":"7px"}),

       dbc.Button("Confirmar e avançar", id="btn-confirmar", color="primary", className="mt-3")
        ], fluid=True, style= {"height":"100vh"})
    ]),

    # -------- TELA DASHBOARD --------
    html.Div(id="tela-dashboard", children=[
        dbc.Container([
            html.H4("Dashboard"),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dbc.Row([
                                dbc.Col([
                                    html.Legend("Financial Analytics")
                                ], sm=8),
                                dbc.Col([
                                    html.I(className="fa fa-balance-scale", style={"font-size":"300%"})
                                ], sm=4, align="center")
                            ]),
                            dbc.Row([
                                    ThemeSwitchAIO(aio_id="theme", themes=[url_theme1, url_theme2])
                            ], style={"margin-top":"10px"}),
                            ])
                    ], style=tab_card)
                ], sm=4, lg=3),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dcc.Graph(id='grafico-2', className='dbc',config=config_graph)
                            ])
                    ], style=tab_card)
                ], sm=4, lg=2),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dcc.Graph(id='grafico-3', className='dbc',config=config_graph)
                            ])
                    ], style=tab_card)
                ], sm=4, lg=2),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dcc.Graph(id='grafico-4', className='dbc',config=config_graph)
                            ])
                    ], style=tab_card)
                ], sm=4, lg=2),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dbc.Row([
                                dbc.Col([
                                    html.H5("Escolha o Mês"),
                                    dbc.RadioItems(
                                        id="radio-month",
                                        options=[],
                                        value=0,
                                        inline=True,
                                        labelCheckedClassName="text-success",
                                        inputCheckedClassName="border border-success bg-success"
                                    ),
                                ])
                            ])
                            ])
                    ], style=tab_card)
                ], sm=4, lg=3)
            ], class_name="g-2 my-auto", style={"margin-top":"7px"}),           
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dbc.Row([
                                html.H5("Fluxo total por Subcategoria")
                            ]),
                            dbc.Row([
                                dcc.Graph(id='grafico-6', className='dbc',config=config_graph)
                            ], style={"margin-top":"7px"})
                        ])
                    ], style=tab_card)
                ], sm=6, lg=4),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody(
                            id="grafico-7"
                        )
                    ], style=tab_card)
                ], sm=6, lg=5),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dbc.Row([
                                dbc.Col([
                                    html.H5("Escolha o Status"),
                                    dbc.RadioItems(
                                        id="radio-status",
                                        options=[],
                                        value=0,
                                        inline=True,
                                        labelCheckedClassName="text-success",
                                        inputCheckedClassName="border border-success bg-success"
                                    ),
                                ])
                            ])
                        ])
                    ], style=tab_card)
                ], sm=6, lg=3)
            ], class_name="g-2 my-auto", style={"margin-top":"7px"}),
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dbc.Row([
                                html.H5("Fluxo Real vs Fluxo Projetado")
                            ]),
                            dbc.Row([
                                dcc.Graph(id='grafico-9', className='dbc',config=config_graph)
                            ], style={"margim-top":"7px"})
                        ])
                    ], style=tab_card)
                ], sm=12, lg=6),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dbc.Row([
                                html.H5("Receita & Despesa por Categorias")
                            ]),
                            dbc.Row([
                                dcc.Graph(id='grafico-10', className='dbc',config=config_graph)
                            ], style={"margim-top":"7px"})
                        ])
                    ], style=tab_card)
                ], sm=12, lg=6)
            ], class_name="g-2 my-auto", style={"margin-top":"7px"}),

            dbc.Button("Inserir Novos Dados", id="btn-voltar", color="primary", className="mt-3")
            
        ], fluid=True, style= {"height":"100vh"})
    ])

])

# -------------------------------
# Upload e leitura do arquivo
# -------------------------------
@app.callback(
    Output("store-dados", "data"),
    Output("dados_fluxo_total", "data"),
    Output("mensagem-upload", "children"),
    Output("preview-tabela", "children"),
    Output("radio-month", "options"),
    Output("radio-status", "options"),
    Output("btn-confirmar", "disabled"),
    Input("upload-arquivo", "contents"),
    State("upload-arquivo", "filename"),
    Input(ThemeSwitchAIO.ids.switch("theme"), "value")
)
def processar_upload(contents, filename, toggle):

    if contents is None:
        return None, None, "", "", [], [], True

    content_type, content_string = contents.split(",")
    decoded = base64.b64decode(content_string)

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(decoded.decode("utf-8")))
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(decoded))
        else:
            return None, None, dbc.Alert("Formato inválido", color="danger"), "", [], [], True
        
        colunas_no_arquivo = df.columns.tolist()
        colunas_faltando = [col for col in colunas_obrigatorias if col not in colunas_no_arquivo]

        if colunas_faltando:
            mensagem_erro = f"Erro! O arquivo está incompleto. Colunas faltando: {', '.join(colunas_faltando)}"
            return None, None, dbc.Alert(mensagem_erro, color="danger"), "", [], [], True
    
        if toggle: # Tema Claro (Flatly)
            cor_fundo = "white"
            cor_texto = "black"
            cor_header = "#f8f9fa"
        else: # Tema Escuro (Darkly)
            cor_fundo = "#222"
            cor_texto = "white"
            cor_header = "#303030"

        preview = dash_table.DataTable(
            data=df.head(5).to_dict("records"),
            columns=[{"name": c, "id": c} for c in df.columns],
            style_header={
                'backgroundColor': cor_header,
                'color': cor_texto,
                'fontWeight': 'bold',
                'border': '1px solid #555'
            },
            style_data={
                'backgroundColor': cor_fundo,
                'color': cor_texto,
                'border': '1px solid #555'
            },
            style_table={'overflowX': 'auto'},
        )

        df["Data"] = pd.to_datetime(df["Data"], format="mixed", dayfirst=True)
        df["Valor"] = pd.to_numeric(df["Valor"], errors="coerce")
        df["Mes"] = df["Data"].dt.month_name()
        df["Mes_num"] = df["Data"].dt.month
        df["Mes_Ordenacao"] = pd.to_datetime(df["Mes"], format='%B')
        df = df.sort_values(by='Mes_Ordenacao').reset_index(drop=True)
        df = df.drop(columns='Mes_Ordenacao')
        df = df.dropna()
        df = df.drop_duplicates()

        options_month = [{'label': 'Ano Todo', 'value':0}]
        for i, j in zip(df["Mes"].unique(), df['Mes_num'].unique()):
            options_month.append({'label':i, 'value':j})
        options_month = sorted(options_month, key=lambda x: x['value'])

        options_status = [{'label': 'Todos', 'value':0}]
        for i in df["Status"].unique():
            options_status.append({'label':i, 'value':i})

        # --------------------------------------------------
        pago = df[df["Status"] == "Paga"]
        receita = pago[pago["Tipo"] == "Receita"]
        despesa = pago[pago["Tipo"] == "Despesa"]
        receita_mensal = receita.groupby("Mes", as_index=False)["Valor"].sum()
        despesa_mensal = despesa.groupby("Mes", as_index=False)["Valor"].sum()
        fluxo_real = pd.merge(receita_mensal, despesa_mensal, on="Mes")
        fluxo_real["Fluxo Real"] = fluxo_real["Valor_x"] + fluxo_real["Valor_y"]

        pendentes = df[df["Status"] == "Pendente"]
        receitas_pendente = pendentes[pendentes["Tipo"] == "Receita"]
        projecao = pd.concat([receitas_pendente, pago], ignore_index=True)
        projecao_receita = projecao[projecao["Tipo"] == "Receita"]
        projecao2 = projecao_receita.groupby(["Mes"], as_index=False)["Valor"].sum()
        projecao_despesa = projecao[projecao["Tipo"] == "Despesa"]
        projecao3 = projecao_despesa.groupby(["Mes"], as_index=False)["Valor"].sum()
        fluxo_projetado = pd.merge(projecao2, projecao3, on="Mes")
        fluxo_projetado["Fluxo projetado"] = fluxo_projetado["Valor_x"] + fluxo_projetado["Valor_y"]

        fluxo_total = pd.merge(fluxo_real, fluxo_projetado, on="Mes")
        fluxo_total.rename(columns={"Valor_x_x": "Receita Real",
                                    "Valor_y_x": "Despesa Real",
                                    "Valor_x_y": "Receita Projetada",
                                    "Valor_y_y": "Despesa Projetada"}, inplace=True)
        fluxo_total["Impacto Pendencia"] = fluxo_total["Fluxo projetado"] - fluxo_total["Fluxo Real"]
        fluxo_total['Mes_Ordenacao'] = pd.to_datetime(fluxo_total['Mes'], format='%B')
        fluxo_total = fluxo_total.sort_values(by='Mes_Ordenacao').reset_index(drop=True)
        fluxo_total = fluxo_total.drop(columns='Mes_Ordenacao')

        # --------------------------------------------------

        return df.to_json(date_format="iso", orient="split"), fluxo_total.to_json(date_format="iso", orient="split"), dbc.Alert("Arquivo carregado com sucesso", color="success"), preview, options_month, options_status, False

    except Exception as e:
        return None, None, dbc.Alert("Erro ao ler arquivo: {e}", color="danger"), "", [], [], True

# -------------------------------
# trocar de tela
# -------------------------------
@app.callback(
    Output("store-tela", "data"),
    Input("btn-confirmar", "n_clicks"),
    Input("btn-voltar", "n_clicks"),
    prevent_initial_call=True
)
def trocar_tela(confirmar, voltar):
    botao = callback_context.triggered[0]["prop_id"]

    if "btn-confirmar" in botao:
        return "dashboard"
    return "upload"

# -------------------------------
# mostrar/esconder telas
# -------------------------------
@app.callback(
    Output("tela-upload", "style"),
    Output("tela-dashboard", "style"),
    Input("store-tela", "data")
)
def controlar_telas(tela):
    if tela == "dashboard":
        return {"display": "none"}, {"display": "block"}
    return {"display": "block"}, {"display": "none"}

# -------------------------------
# kpis 
# -------------------------------
@app.callback(
        Output("grafico-2", "figure"),
        Output("grafico-3", "figure"),
        Output("grafico-4", "figure"),
        Input("store-dados", "data"),
        Input("radio-month", "value"),
        Input(ThemeSwitchAIO.ids.switch("theme"), "value")
)
def kpis(data, mes, toggle):
    template = template_theme1 if toggle else template_theme2

    if data is None:
        return {}, {}, {}
    
    df = pd.read_json(data, orient="split")
    if mes == 0:
        mask = df["Mes_num"].isin(df["Mes_num"].unique())
    else:
        mask = df["Mes_num"].isin([mes])
    df_1 = df.loc[mask]

    df_receita = df_1[df_1["Tipo"] == "Receita"]
    df_receita_paga = df_receita[df_receita["Status"] == "Paga"]
    df_pend_paga = df_receita[df_receita["Status"] != "Cancelada"]
    df_pendente = df_receita[df_receita["Status"] == "Pendente"]
    df_despesa = df_1[df_1["Tipo"] == "Despesa"]
    df_despesa_paga = df_despesa[df_despesa["Status"] == "Paga"]

    fig_2 = go.Figure()
    fig_2.add_trace(go.Indicator(mode='delta+number',
                                 title=("Fluxo de Caixa"),
                                 value=df_receita_paga["Valor"].sum(),
                                 delta={'relative':True, 'valueformat':'.1%', 'reference':df_pend_paga["Valor"].sum()},
                                 number={'suffix':' MZN'},
                                 ))
    fig_2.update_layout(main_config, height=130, template=template)
    fig_2.update_layout({'margin':{'l':0, 'r':0, 't':0, 'b':0}})

    fig_3 = go.Figure()
    fig_3.add_trace(go.Indicator(mode='number',
                                 title=("Receita Pendente"),
                                 value=df_pendente["Valor"].sum(),
                                 number={'suffix':' MZN'},
                                 ))
    fig_3.update_layout(main_config, height=130, template=template)
    fig_3.update_layout({'margin':{'l':0, 'r':0, 't':0, 'b':0}})

    fig_4 = go.Figure()
    fig_4.add_trace(go.Indicator(mode='number',
                                 title=("Despesas Pagas"),
                                 value=df_despesa_paga["Valor"].sum(),
                                 number={'suffix':' MZN'},
                                 ))
    fig_4.update_layout(main_config, height=130, template=template)
    fig_4.update_layout({'margin':{'l':0, 'r':0, 't':0, 'b':0}})

    return fig_2, fig_3, fig_4

# -------------------------------
# gráfico linha 2
# -------------------------------
@app.callback(
        Output("grafico-6", "figure"),
        Output("grafico-7", "children"),
        Input("store-dados", "data"),
        Input("radio-month", "value"),
        Input("radio-status", "value"),
        Input(ThemeSwitchAIO.ids.switch("theme"), "value")
)
def graph_2(df, mes, status, toggle):
    template = template_theme1 if toggle else template_theme2

    if df is None:
        return {}, ""
    
    df = pd.read_json(df, orient="split")
    if mes == 0:
        mask = df["Mes_num"].isin(df["Mes_num"].unique())
    else:
        mask = df["Mes_num"].isin([mes])
    df_2 = df.loc[mask]

    if status == 0:
        mask_status = df_2["Status"].isin(df_2["Status"].unique())
    else:
        mask_status = df_2["Status"].isin([status])
    df_2 = df_2.loc[mask_status]
    df_receita = df_2[df_2["Tipo"] == "Receita"]

    fig_6 = px.pie(df_2,
            names="Subcategoria",
            values="Valor")
    fig_6.update_layout(main_config, height=200, template=template)
    fig_6.update_layout(
            margin={'l':0, 'r':150, 't':0, 'b':0},
            legend={
                'x':1.05,
                'y':0.5,
                'xanchor':"left",
                'yanchor':"middle"
            }
        )

    df_pendente = df_receita[df_receita["Status"] == "Pendente"]
    pendente_agrupado = df_pendente.groupby("Forma de Pagamento", as_index=False)["Valor"].sum()

    if status == "Pendente":
        fig_7 = px.bar(pendente_agrupado,
                        x="Forma de Pagamento",
                        y="Valor")
        fig_7.update_layout(main_config, height=200, template=template)
        return fig_6, [dbc.Row([html.H5("Receitas Pendentes por Forma de Pagamento")]),dbc.Row(dcc.Graph(figure=fig_7, className='dbc',config=config_graph),style={"margim-top":"7px"})]

    return fig_6, html.Div(html.H3("Selecione 'Pendente' no filtro de Status para ver esta análise", className="text-center"), className="d-flex justify-content-center align-items-center h-100")

# -------------------------------
# gráfico linha 3
# -------------------------------
@app.callback(
    Output("grafico-9", "figure"),
    Output("grafico-10", "figure"),
    Input("dados_fluxo_total", "data"),
    Input("store-dados", "data"),
    Input("radio-month", "value"),
    Input("radio-status", "value"),
    Input(ThemeSwitchAIO.ids.switch("theme"), "value")
)
def atualizar_dashboard(data_json1, data_jason2, mes, status, toggle):
    template = template_theme1 if toggle else template_theme2

    if data_json1 is None:
        return {}, {}
    
    df1 = pd.read_json(data_json1, orient="split")

    fig_px = px.line(
    df1,
    x='Mes',
    y=['Fluxo Real', 'Fluxo projetado', 'Impacto Pendencia'],
    )
    fig_px.update_layout(main_config, height=250, template=template)
    fig_px.update_layout(
        legend={
            'x':1.05,
            'y':1,
            'xanchor':"left",
            'yanchor':"top"
        }
    )

    df2 = pd.read_json(data_jason2, orient="split")
    if mes == 0:
        mask = df2["Mes_num"].isin(df2["Mes_num"].unique())
    else:
        mask = df2["Mes_num"].isin([mes])
    df_4 = df2.loc[mask]

    if status == 0:
        mask_status = df_4["Status"].isin(df_4["Status"].unique())
    else:
        mask_status = df_4["Status"].isin([status])
    df_4 = df_4.loc[mask_status]

    Categoria = df_4.groupby(["Categoria", "Tipo"], as_index=False)['Valor'].sum()

    fig2 = px.bar(Categoria, x="Categoria", y="Valor",
                 color="Tipo", color_discrete_map={"Receita":"blue",
                                                   "Despesa":"red"})
    fig2.update_layout(main_config, height=250, template=template)
    fig2.update_layout(
        legend={
            'x':1.05,
            'y':1,
            'xanchor':"left",
            'yanchor':"top"
        }
    )

    return fig_px, fig2




if __name__ == "__main__":
    app.run(debug=True)