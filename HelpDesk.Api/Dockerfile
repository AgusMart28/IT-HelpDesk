
# Etapa 1: Compilar la aplicación
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copiar el proyecto y restaurar dependencias
COPY HelpDesk.Api.csproj ./
RUN dotnet restore

# Copiar el resto del código
COPY . ./

# Publicar la API
RUN dotnet publish -c Release -o /app/publish --no-restore

# Etapa 2: Ejecutar la aplicación
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish ./

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "HelpDesk.Api.dll"]
