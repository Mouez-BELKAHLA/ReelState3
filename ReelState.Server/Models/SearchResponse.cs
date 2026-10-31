using System.Collections.Generic;
using ReelState.Server.Models;

namespace ReelState.Server.Models.DTOs
{
    public class SearchResponse
    {
        public List<ReelState.Server.Models.DTOs.PropertySearchItemDto> Properties { get; set; } = new List<ReelState.Server.Models.DTOs.PropertySearchItemDto>();
        public int TotalCount { get; set; }
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}