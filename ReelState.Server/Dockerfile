FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["ReelState.Server.csproj", "./"]
RUN dotnet restore "ReelState.Server.csproj"
COPY . .
RUN dotnet publish "ReelState.Server.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:$PORT dotnet ReelState.Server.dll"]